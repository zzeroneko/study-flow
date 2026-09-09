import type { App, TFile } from "obsidian";
import { Notice, normalizePath as obsidianNormalizePath, TFolder } from "obsidian";
import { currentTimestamp } from "../templates/render";
import { getMarkdownFiles } from "./vaultIndex";
import {
  classifyScheduleTime,
  CourseInfo,
  CourseSchedule,
  escapeYamlString,
  makeWikiLink,
  normalizePath,
  periodToTime,
  sanitizeFileName,
  semesterIndexPath,
  todayKoreanDay,
  todayText,
  UNIVERSITY_ROOT,
} from "./constants";
import { getPluginLanguage, t } from "./i18n";

export function notice(message: string): void {
  new Notice(message);
}

const MANAGED_TYPES = new Set(["daily", "university", "lecture", "single"]);
const folderLocks = new Map<string, Promise<void>>();
const fileCreationLocks = new Map<string, Promise<TFile | null>>();
const timestampUpdates = new Set<string>();

export async function updateManagedFileTimestamp(app: App, file: TFile): Promise<void> {
  if (file.extension !== "md") return;
  if (timestampUpdates.has(file.path)) return;

  const content = await app.vault.cachedRead(file);
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return;

  const type = frontmatter[1].match(/^type:\s*(\S+)\s*$/m)?.[1];
  const body = frontmatter[1];
  const createdMatch = body.match(/^created:\s*(.*)\s*$/m);
  const updatedMatch = body.match(/^updated:\s*(.*)\s*$/m);
  const created = createdMatch?.[1]?.trim() ? createdMatch : null;
  const updated = updatedMatch?.[1]?.trim() ? updatedMatch : null;
  if ((!type || !MANAGED_TYPES.has(type)) && !created && !updated) return;

  const timestamp = currentTimestamp();
  let next = body;

  if (!created) {
    const createdAt = currentTimestamp(new Date(file.stat.ctime));
    next = createdMatch
      ? next.replace(/^created:\s*.*$/m, `created: ${createdAt}`)
      : `${next.trimEnd()}\ncreated: ${createdAt}\n`;
  }
  if (created?.[1] && updated?.[1]?.trim() === timestamp) return;
  if (updatedMatch) {
    next = next.replace(/^updated:\s*.*$/m, `updated: ${timestamp}`);
  } else {
    next = `${next.trimEnd()}\nupdated: ${timestamp}\n`;
  }

  const nextContent = content.replace(frontmatter[1], next);
  if (nextContent !== content) {
    timestampUpdates.add(file.path);
    try {
      await app.vault.modify(file, nextContent);
    } finally {
      timestampUpdates.delete(file.path);
    }
  }
}

export async function exists(app: App, path: string): Promise<boolean> {
  return await app.vault.adapter.exists(normalizePath(path));
}

export async function ensureFolder(app: App, path: string): Promise<void> {
  const normalized = normalizePath(path);
  if (!normalized) return;
  const previous = folderLocks.get(normalized);
  if (previous) {
    await previous;
    return;
  }

  const operation = (async () => {
    const parts = normalized.split("/");
    let current = "";

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await exists(app, current))) {
        await app.vault.createFolder(current);
      }
    }
  })();
  folderLocks.set(normalized, operation);
  try {
    await operation;
  } finally {
    if (folderLocks.get(normalized) === operation) folderLocks.delete(normalized);
  }
}

export async function createFileIfMissing(app: App, path: string, content: string): Promise<TFile | null> {
  const normalized = normalizePath(path);
  const previous = fileCreationLocks.get(normalized);
  if (previous) {
    await previous;
    return null;
  }

  const operation = (async () => {
    if (await exists(app, normalized)) return null;
    await ensureFolder(app, normalized.split("/").slice(0, -1).join("/"));
    return await app.vault.create(normalized, content);
  })();
  fileCreationLocks.set(normalized, operation);
  try {
    return await operation;
  } finally {
    if (fileCreationLocks.get(normalized) === operation) fileCreationLocks.delete(normalized);
  }
}

export async function openPath(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(obsidianNormalizePath(path));
  if (file && "extension" in file) {
    await app.workspace.getLeaf(true).openFile(file as TFile);
  }
}

export function loadCourse(app: App, file: TFile): CourseInfo | null {
  const normalizedPath = normalizePath(file.path);
  if (!normalizedPath.startsWith(`${UNIVERSITY_ROOT}/`)) return null;
  if (normalizedPath.includes("/Common/") || normalizedPath.includes("/Exports/")) {
    return null;
  }

  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter || frontmatter.type !== "university") return null;

  const courseName = String(frontmatter.courseName ?? file.basename ?? "").trim();
  const semester = String(frontmatter.semester ?? "").trim();
  const status = String(frontmatter.status ?? "").trim();
  if (!courseName || !semester || courseName.includes("{{") || semester.includes("{{")) return null;

  const folder = file.parent?.path ?? normalizedPath.split("/").slice(0, -1).join("/");
  const schedule = Array.isArray(frontmatter.schedule) ? (frontmatter.schedule as CourseSchedule[]) : [];
  return {
    path: file.path,
    folder,
    lecturesFolder: `${folder}/Lectures`,
    courseName,
    semester,
    status,
    schedule,
  };
}

export function loadCourses(app: App, options: { status?: string; semester?: string } = {}): CourseInfo[] {
  const { status, semester } = options;
  const courses = getMarkdownFiles(app)
    .map((file) => loadCourse(app, file))
    .filter((course) => {
      if (!course) return false;
      if (status && course.status !== status) return false;
      if (semester && course.semester !== semester) return false;
      return true;
    })
    .filter((item): item is CourseInfo => Boolean(item));

  courses.sort((a, b) => {
    const semesterCompare = String(b.semester).localeCompare(String(a.semester), "ko");
    if (semesterCompare !== 0) return semesterCompare;
    return String(a.courseName).localeCompare(String(b.courseName), "ko");
  });

  return courses;
}

export interface TodayMatch {
  course: CourseInfo;
  schedule: CourseSchedule;
  week: number | "";
  date: string;
  label: string;
  phase: "current" | "next" | "past" | "unknown";
  distanceMinutes: number;
}

export function todayMatchingSchedules(courses: CourseInfo[]): TodayMatch[] {
  const todayDay = todayKoreanDay();
  const today = todayText();
  const matches: TodayMatch[] = [];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const course of courses) {
    for (const schedule of course.schedule ?? []) {
      if (schedule.day !== todayDay) continue;
      const { phase, distanceMinutes } = classifyScheduleTime(schedule.period, nowMinutes);
      const phaseLabel = phase === "current" ? t("now") : phase === "next" ? t("nextClass") : phase === "past" ? t("pastClass") : t("today");

      matches.push({
        course,
        schedule,
        week: 1,
        date: today,
        phase,
        distanceMinutes,
        label: [
          phaseLabel,
          course.courseName,
          schedule.period ? t("period", { period: schedule.period }) : "",
          periodToTime(schedule.period),
          schedule.online ? t("online") : schedule.location || "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }

  const phaseOrder: Record<TodayMatch["phase"], number> = { current: 0, next: 1, unknown: 2, past: 3 };
  return matches.sort(
    (a, b) =>
      phaseOrder[a.phase] - phaseOrder[b.phase] ||
      a.distanceMinutes - b.distanceMinutes ||
      a.course.courseName.localeCompare(b.course.courseName, "ko"),
  );
}

export async function appendCourseToSemesterIndex(
  app: App,
  semester: string,
  coursePath: string,
  courseName: string,
): Promise<void> {
  const indexPath = semesterIndexPath(semester);
  const link = makeWikiLink(coursePath, courseName);
  const bullet = `- ${link}`;

  if (!(await exists(app, indexPath))) {
    await ensureFolder(app, `${UNIVERSITY_ROOT}/${semester}`);
    const content = `---
type: semester-index
semester: "${escapeYamlString(semester)}"
tags:
  - university
  - semester
---

# ${semester}${getPluginLanguage() === "ko" ? "학기" : ""}

[[00_Home|Home]]

## ${t("course")}

${bullet}
`;
    await app.vault.create(indexPath, content);
    return;
  }

  const file = app.vault.getAbstractFileByPath(indexPath);
  if (!file || file instanceof TFolder) return;

  const current = await app.vault.read(file as TFile);
  if (current.includes(coursePath.replace(/\.md$/, "")) || current.includes(`|${courseName}]]`)) {
    return;
  }

  const sectionHeading = getPluginLanguage() === "ko" ? "과목" : "Course";
  if (new RegExp(`## ${sectionHeading}\\s*\\n`).test(current)) {
    await app.vault.modify(file as TFile, current.replace(new RegExp(`(## ${sectionHeading}\\s*\\n)`), `$1${bullet}\n`));
  } else {
    await app.vault.modify(file as TFile, `${current.trimEnd()}\n\n## ${t("course")}\n\n${bullet}\n`);
  }
}
