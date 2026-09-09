import type { App } from "obsidian";
import {
  DAILY_FOLDER,
  makeWikiLink,
  periodToTime,
  todayText,
} from "../core/constants";
import {
  createFileIfMissing,
  exists,
  loadCourses,
  notice,
  openPath,
  todayMatchingSchedules,
} from "../core/vault";
import { getTemplateSet } from "../templates";
import { t } from "../core/i18n";
import { managedTimestampValues, renderTemplate } from "../templates/render";

export async function createOrOpenDaily(app: App): Promise<void> {
  const date = todayText();
  const path = `${DAILY_FOLDER}/${date}.md`;

  if (await exists(app, path)) {
    await openPath(app, path);
    notice(t("dailyOpened", { date }));
    return;
  }

  const courses = loadCourses(app, { status: "studying" });
  const matches = todayMatchingSchedules(courses);
  const todayClasses = matches.length
    ? matches
        .map(
          ({ course, schedule }) =>
            `- ${makeWikiLink(course.path, course.courseName)} · ${t("period", { period: schedule.period })} · ${
              periodToTime(schedule.period) || t("timeUnknown")
            } · ${schedule.online ? t("online") : schedule.location || t("locationUnknown")}`,
        )
        .join("\n")
    : `- ${t("noClasses")}`;
  const content = renderTemplate(getTemplateSet().daily, {
    DATE: date,
    date,
    TODAY_CLASSES: todayClasses,
    ...managedTimestampValues(),
  });
  const file = await createFileIfMissing(app, path, content);

  if (file) {
    await app.workspace.getLeaf(true).openFile(file);
    notice(t("dailyCreated", { date }));
  } else {
    await openPath(app, path);
  }
}
