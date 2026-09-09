import { App, FuzzySuggestModal, TFile } from "obsidian";
import {
  CourseInfo,
  escapeYamlString,
  makeWikiLink,
  pad2,
  sanitizeFileName,
  todayText,
} from "../core/constants";
import type { UnivVaultStore } from "../core/pluginData";
import {
  createFileIfMissing,
  exists,
  loadCourse,
  loadCourses,
  notice,
  openPath,
  todayMatchingSchedules,
  TodayMatch,
} from "../core/vault";
import { getTemplateSet, renderLectureSections } from "../templates";
import { managedTimestampValues, renderTemplate } from "../templates/render";
import { QuickLectureModal, type QuickLectureFormResult } from "../modals/QuickLectureModal";
import { getPluginLanguage, t } from "../core/i18n";

interface LectureData {
  course: CourseInfo;
  week: number;
  date: string;
  sessionType: string;
  classDay: string;
  classPeriod: string;
  location: string;
  online: boolean;
  quick?: QuickLectureFormResult;
}

function buildLectureFileName(data: LectureData): string {
  if (data.quick?.title) {
    return `${data.date}-${sanitizeFileName(data.quick.title)}.md`;
  }
  const slot = `${data.classDay}${data.classPeriod}` || data.date;
  return `${pad2(data.week)}${getPluginLanguage() === "ko" ? "주차" : "week"}-${slot}.md`;
}

async function rememberCourse(store: UnivVaultStore, coursePath: string): Promise<void> {
  const current = store.getData().recentCoursePaths;
  await store.updateData({
    recentCoursePaths: [coursePath, ...current.filter((path) => path !== coursePath)].slice(0, 10),
  });
}

async function createLectureNote(app: App, data: LectureData, store: UnivVaultStore): Promise<void> {
  const fileName = sanitizeFileName(buildLectureFileName(data));
  if (!fileName || fileName === ".md" || fileName === "..md") {
    notice(t("lectureFileNameError"));
    return;
  }
  const lecturePath = `${data.course.lecturesFolder}/${fileName}`;

  if (await exists(app, lecturePath)) {
    await openPath(app, lecturePath);
    await rememberCourse(store, data.course.path);
    notice(t("lectureExists", { file: fileName }));
    return;
  }

  const courseLink = makeWikiLink(data.course.path, data.course.courseName);
  let content = renderTemplate(getTemplateSet().lecture, {
    COURSE_LINK_YAML: escapeYamlString(courseLink),
    COURSE_LINK: courseLink,
    SEMESTER: escapeYamlString(data.course.semester),
    WEEK: data.week,
    DATE: data.date,
    SESSION_TYPE_FIELD: data.sessionType ? `sessionType: "${escapeYamlString(data.sessionType)}"\n` : "",
    CLASS_DAY_FIELD: data.classDay ? `classDay: "${escapeYamlString(data.classDay)}"\n` : "",
    CLASS_PERIOD_FIELD: data.classPeriod ? `classPeriod: "${escapeYamlString(data.classPeriod)}"\n` : "",
    LOCATION_FIELD: data.location ? `location: "${escapeYamlString(data.location)}"\n` : "",
    ONLINE_FIELD: data.online ? "online: true\n" : "",
    CLASS_INFO: data.classDay && data.classPeriod ? ` · ${data.classDay} ${t("period", { period: data.classPeriod })}` : "",
    CLASS_DAY: data.classDay,
    CLASS_PERIOD: data.classPeriod,
    TITLE: escapeYamlString(data.quick?.title ?? t("lecture")),
    LECTURE_SECTIONS: renderLectureSections(data.quick?.task, getPluginLanguage()),
    ...managedTimestampValues(),
  });

  // Also replace unescaped course link in body
  content = content.split(escapeYamlString(courseLink)).join(courseLink);
  if (data.quick) {
    const body = data.quick.content.trim();
    const notesHeading = getPluginLanguage() === "en" ? "## Notes" : "## 필기";
    const conceptsHeading = getPluginLanguage() === "en" ? "## Key concepts" : "## 핵심 개념";
    if (body) content = content.replace(`${notesHeading}\n\n- `, `${notesHeading}\n\n${body}`);
    else content = content.replace(new RegExp(`\\n${notesHeading}\\n\\n- \\n?`), "");
    content = content.replace(new RegExp(`\\n${conceptsHeading}\\n\\n- \\n?`), "");
  }

  const file = await createFileIfMissing(app, lecturePath, content);
  if (!file) {
    notice(t("lectureExists", { file: fileName }));
    return;
  }

  await app.workspace.getLeaf(true).openFile(file);
  await rememberCourse(store, data.course.path);
  notice(t("lectureCreated", { file: fileName }));
}

class MatchSuggestModal extends FuzzySuggestModal<TodayMatch> {
  constructor(
    app: App,
    private matches: TodayMatch[],
    private onPick: (value: TodayMatch) => void,
  ) {
    super(app);
    this.setPlaceholder(t("chooseTodayClass"));
  }

  getItems(): TodayMatch[] {
    return this.matches;
  }

  getItemText(item: TodayMatch): string {
    return item.label;
  }

  onChooseItem(item: TodayMatch): void {
    this.onPick(item);
  }
}

class CourseSuggestModal extends FuzzySuggestModal<CourseInfo> {
  constructor(
    app: App,
    private courses: CourseInfo[],
    private onPick: (course: CourseInfo) => void,
  ) {
    super(app);
    this.setPlaceholder(t("chooseCourse"));
  }

  getItems(): CourseInfo[] {
    return this.courses;
  }

  getItemText(item: CourseInfo): string {
    return `${item.semester} · ${item.courseName}`;
  }

  onChooseItem(item: CourseInfo): void {
    this.onPick(item);
  }
}

function sortByRecent(courses: CourseInfo[], recentPaths: string[]): CourseInfo[] {
  const recentOrder = new Map(recentPaths.map((path, index) => [path, index]));
  return [...courses].sort((a, b) => {
    const aOrder = recentOrder.get(a.path) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = recentOrder.get(b.path) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}

async function createForCourseToday(app: App, course: CourseInfo, store: UnivVaultStore): Promise<void> {
  const [todayMatch] = todayMatchingSchedules([course]);
  if (todayMatch) {
    await createLectureForMatch(app, todayMatch, store);
    return;
  }

  await createLectureNote(
    app,
    {
      course,
      week: 1,
      date: todayText(),
      sessionType: "extra",
      classDay: "",
      classPeriod: "",
      location: "",
      online: false,
    },
    store,
  );
}

async function chooseCourseForToday(app: App, store: UnivVaultStore): Promise<void> {
  const courses = sortByRecent(loadCourses(app), store.getData().recentCoursePaths);
  if (courses.length === 0) {
    notice(t("noCourses"));
    return;
  }
  if (courses.length === 1) {
    await createForCourseToday(app, courses[0], store);
    return;
  }
  new CourseSuggestModal(app, courses, (course) => void createForCourseToday(app, course, store)).open();
}

export async function createLectureForMatch(
  app: App,
  match: TodayMatch,
  store: UnivVaultStore,
): Promise<void> {
  await createLectureNote(
    app,
    {
      course: match.course,
      week: Number(match.week) || 1,
      date: match.date,
      sessionType: "regular",
      classDay: match.schedule.day ?? "",
      classPeriod: match.schedule.period ?? "",
      location: match.schedule.online ? "" : match.schedule.location ?? "",
      online: Boolean(match.schedule.online),
    },
    store,
  );
}

export async function createLectureForCourse(app: App, coursePath: string, store: UnivVaultStore): Promise<void> {
  const abstractFile = app.vault.getAbstractFileByPath(coursePath);
  if (!(abstractFile instanceof TFile)) {
    notice(t("generatedCourseMissing"));
    return;
  }

  let course = loadCourse(app, abstractFile);
  for (let attempt = 0; !course && attempt < 5; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    course = loadCourse(app, abstractFile);
  }
  if (!course) {
    notice(t("generatedCourseMissing"));
    return;
  }
  await createForCourseToday(app, course, store);
}

export async function createLectureCommand(app: App, store: UnivVaultStore): Promise<void> {
  const courses = loadCourses(app);
  if (courses.length === 0) {
    notice(t("noCoursesCommand"));
    return;
  }

  const studying = courses.filter((course) => course.status === "studying");
  const matches = todayMatchingSchedules(studying.length > 0 ? studying : courses);

  if (matches.length === 1 || matches[0]?.phase === "current") {
    await createLectureForMatch(app, matches[0], store);
    return;
  }

  if (matches.length > 1) {
    new MatchSuggestModal(app, matches, async (picked) => {
      await createLectureForMatch(app, picked, store);
    }).open();
    return;
  }

  await chooseCourseForToday(app, store);
}

async function createQuickLectureForCourse(
  app: App,
  course: CourseInfo,
  store: UnivVaultStore,
): Promise<void> {
  const [todayMatch] = todayMatchingSchedules([course]);
  const match = todayMatch;
  new QuickLectureModal(app, course.courseName, async (quick) => {
    await createLectureNote(
      app,
      {
        course,
        week: Number(match?.week) || 1,
        date: todayText(),
        sessionType: match ? "regular" : "extra",
        classDay: match?.schedule.day ?? "",
        classPeriod: match?.schedule.period ?? "",
        location: match?.schedule.online ? "" : match?.schedule.location ?? "",
        online: Boolean(match?.schedule.online),
        quick,
      },
      store,
    );
  }).open();
}

export async function createQuickLectureCommand(
  app: App,
  store: UnivVaultStore,
  selectedCourse?: CourseInfo,
): Promise<void> {
  const courses = sortByRecent(loadCourses(app), store.getData().recentCoursePaths);
  if (!courses.length) {
    notice(t("noCoursesCommand"));
    return;
  }
  if (selectedCourse) {
    const current = courses.find((course) => course.path === selectedCourse.path) ?? selectedCourse;
    await createQuickLectureForCourse(app, current, store);
    return;
  }
  if (courses.length === 1) {
    await createQuickLectureForCourse(app, courses[0], store);
    return;
  }
  new CourseSuggestModal(app, courses, (course) => void createQuickLectureForCourse(app, course, store)).open();
}
