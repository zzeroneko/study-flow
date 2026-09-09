export {
  PERIOD_START,
  PERIOD_END,
  JS_DAY_TO_KR,
  pad2,
  parsePeriod,
  periodToTime,
  periodStartTime,
  periodEndTime,
  classifyScheduleTime,
} from "./dateMath.ts";
export type { PeriodRange, SchedulePhase } from "./dateMath.ts";

import { JS_DAY_TO_KR, parsePeriod } from "./dateMath.ts";
import { getPluginLanguage } from "./i18n.ts";

export const UNIVERSITY_ROOT = "20_University";
export const DAILY_FOLDER = "10_Daily";
export const PERSONAL_STUDY_ROOT = "30_Personal";

export const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export function getDefaultSemesters(year = new Date().getFullYear()): string[] {
  return [`${year}-1`, `${year}-2`];
}

export interface CourseSchedule {
  id?: string;
  day: string;
  period: string;
  location?: string;
  online?: boolean;
}

export interface CourseInfo {
  path: string;
  folder: string;
  lecturesFolder: string;
  courseName: string;
  semester: string;
  status: string;
  schedule: CourseSchedule[];
}

export function normalizePath(path: string): string {
  return String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

export function sanitizeFileName(name: string): string {
  return String(name ?? "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeYamlString(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

export function todayText(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function todayKoreanDay(): string {
  return JS_DAY_TO_KR[new Date().getDay()];
}

export function makeWikiLink(path: string, alias: string): string {
  const withoutExtension = String(path).replace(/\.md$/, "");
  return `[[${withoutExtension}|${alias}]]`;
}

export function makeScheduleId(day: string, periodText: string): string {
  const parsed = parsePeriod(periodText);
  const period = parsed ? parsed.text : String(periodText ?? "").replace(/\s+/g, "");
  return `${day}${period}`;
}

export function semesterIndexPath(semester: string): string {
  return `${UNIVERSITY_ROOT}/${semester}/00_${semester}${getPluginLanguage() === "ko" ? " 학기" : " Semester"}.md`;
}
