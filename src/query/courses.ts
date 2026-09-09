import type { App } from "obsidian";
import { loadCourses } from "../core/vault";
import type { CourseInfo } from "../core/constants";

export type { CourseInfo };

export function queryCourses(
  app: App,
  options: { status?: string; semester?: string; folderPrefix?: string } = {},
): CourseInfo[] {
  return loadCourses(app, {
    status: options.status,
    semester: options.semester,
  }).filter((course) => {
    if (!options.folderPrefix) return true;
    return course.path.startsWith(options.folderPrefix.replace(/\\/g, "/"));
  });
}
