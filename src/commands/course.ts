import type { App } from "obsidian";
import {
  escapeYamlString,
  makeScheduleId,
  parsePeriod,
  sanitizeFileName,
  UNIVERSITY_ROOT,
} from "../core/constants";
import type { CourseDraft, UnivVaultStore } from "../core/pluginData";
import {
  appendCourseToSemesterIndex,
  createFileIfMissing,
  ensureFolder,
  exists,
  loadCourses,
  notice,
  openPath,
} from "../core/vault";
import { CourseCreateModal, type CourseFormResult } from "../modals/CourseCreateModal";
import { getTemplateSet } from "../templates";
import { managedTimestampValues, renderTemplate } from "../templates/render";
import { t } from "../core/i18n";

function buildScheduleYaml(schedules: CourseFormResult["schedules"]): string {
  if (!schedules.length) return "schedule: []";
  const lines = ["schedule:"];
  for (const schedule of schedules) {
    const parsed = parsePeriod(schedule.period);
    const period = parsed ? parsed.text : schedule.period;
    const id = schedule.id || makeScheduleId(schedule.day, period);
    lines.push(`  - id: "${escapeYamlString(id)}"`);
    lines.push(`    day: "${escapeYamlString(schedule.day)}"`);
    lines.push(`    period: "${escapeYamlString(period)}"`);
    lines.push(`    location: "${escapeYamlString(schedule.online ? "" : schedule.location ?? "")}"`);
    lines.push(`    online: ${schedule.online ? "true" : "false"}`);
  }
  return lines.join("\n");
}

async function createCourseFromForm(
  app: App,
  data: CourseFormResult,
): Promise<{ path: string } | null> {
  const courseName = data.courseName.trim();
  const courseFolderName = sanitizeFileName(courseName);
  if (!courseFolderName) {
    notice(t("invalidCourseName"));
    return null;
  }
  if (courseFolderName === "." || courseFolderName === "..") {
    notice(t("unusableCourseName"));
    return null;
  }

  const courseFolder = `${UNIVERSITY_ROOT}/${data.semester}/${courseFolderName}`;
  const coursePath = `${courseFolder}/${courseFolderName}.md`;
  if (await exists(app, coursePath)) {
    await openPath(app, coursePath);
    notice(t("courseAlreadyOpened"));
    return null;
  }

  await ensureFolder(app, `${courseFolder}/Lectures`);
  const template = getTemplateSet().course.replace(/^schedule:\s*\[\]\s*$/m, buildScheduleYaml(data.schedules));
  const content = renderTemplate(template, {
    SEMESTER: escapeYamlString(data.semester),
    COURSE_NAME_YAML: escapeYamlString(courseName),
    COURSE_NAME: courseName,
    COURSE_FOLDER: courseFolder,
    ...managedTimestampValues(),
  });
  const created = await createFileIfMissing(app, coursePath, content);
  if (!created) return null;

  await appendCourseToSemesterIndex(app, data.semester, coursePath, courseName);
  notice(t("courseCreated", { name: courseName }));
  return { path: coursePath };
}

function uniqueRecent(values: string[], existing: string[], limit = 20): string[] {
  return [...new Set([...values.filter(Boolean), ...existing.filter(Boolean)])].slice(0, limit);
}

function buildDraft(store: UnivVaultStore): CourseDraft {
  return (
    store.getData().courseDraft ?? {
      semester: store.getData().lastSemester,
      courseName: "",
      schedules: [],
      step: 0,
    }
  );
}

function collectLocations(app: App, store: UnivVaultStore): string[] {
  const fromCourses = loadCourses(app)
    .flatMap((course) => course.schedule)
    .map((schedule) => schedule.location?.trim() ?? "")
    .filter(Boolean);
  return uniqueRecent(store.getData().recentLocations, fromCourses);
}

export async function createCourseCommand(app: App, store: UnivVaultStore): Promise<void> {
  new CourseCreateModal(
    app,
    collectLocations(app, store),
    buildDraft(store),
    async (draft) => store.updateData({ courseDraft: draft }),
    async (data) => {
      if (!data) return;
      try {
        const created = await createCourseFromForm(app, data);
        if (!created) return;

        await store.updateData({
          courseDraft: undefined,
          lastSemester: data.semester,
          recentLocations: uniqueRecent(
            data.schedules.map((schedule) => schedule.location ?? ""),
            store.getData().recentLocations,
          ),
          recentCoursePaths: uniqueRecent([created.path], store.getData().recentCoursePaths, 10),
        });

        await openPath(app, created.path);
      } catch (error) {
        console.error(error);
        notice(t("courseCreateError", { error: (error as Error).message ?? error }));
      }
    },
  ).open();
}
