import type { App } from "obsidian";
import { CourseOverviewModal } from "../modals/CourseOverviewModal";
import { loadCourses, notice } from "../core/vault";
import type { UnivVaultStore } from "../core/pluginData";
import { FuzzySuggestModal } from "obsidian";
import type { CourseInfo } from "../core/constants";
import { createQuickLectureCommand } from "./lecture";
import { t } from "../core/i18n";

class CoursePicker extends FuzzySuggestModal<CourseInfo> {
  constructor(
    app: App,
    private courses: CourseInfo[],
    private onPick: (course: CourseInfo) => void,
  ) {
    super(app);
    this.setPlaceholder(t("chooseCourseView"));
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

export async function openCourseViewCommand(app: App, store: UnivVaultStore): Promise<void> {
  const courses = loadCourses(app);
  if (!courses.length) {
    notice(t("noCoursesCommand"));
    return;
  }
  const open = (course: CourseInfo): void => {
    new CourseOverviewModal(app, course, () => createQuickLectureCommand(app, store, course)).open();
  };
  if (courses.length === 1) {
    open(courses[0]);
    return;
  }
  new CoursePicker(app, courses, open).open();
}
