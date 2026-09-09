import { TFile, type App } from "obsidian";
import { normalizePath, parsePeriod, sanitizeFileName, UNIVERSITY_ROOT } from "./constants";
import { getMarkdownFiles } from "./vaultIndex";
import { updateManagedFileTimestamp } from "./vault";
import { t } from "./i18n";

const MANAGED_TYPES = new Set(["daily", "university", "lecture", "single"]);
const GENERATED_TYPES = new Set(["daily", "university", "lecture", "semester-index", "dashboard"]);

export interface IntegrityIssue {
  kind: "timestamp" | "course" | "reference" | "duplicate" | "file";
  path: string;
  message: string;
  safeFix: boolean;
}

export interface IntegrityReport {
  issues: IntegrityIssue[];
  checkedFiles: number;
  fixed: number;
}

function frontmatter(app: App, file: TFile): Record<string, unknown> {
  return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
}

function isUniversityPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.startsWith(`${UNIVERSITY_ROOT}/`) &&
    !normalized.includes("/Common/") &&
    !normalized.includes("/Exports/");
}

function isValidSemester(value: unknown): boolean {
  return /^\d{4}-(?:1|2)$/.test(String(value ?? "").trim());
}

function hasValidManagedLocation(type: string, path: string): boolean {
  const normalized = normalizePath(path);
  if (type === "dashboard") return normalized === "00_Home.md";
  if (type === "daily") return normalized.startsWith("10_Daily/");
  if (type === "university") return /^20_University\/\d{4}-[12]\/[^/]+\/[^/]+\.md$/.test(normalized);
  if (type === "lecture") return isUniversityPath(path) && normalized.includes("/Lectures/");
  if (type === "semester-index") return /^20_University\/\d{4}-[12]\/00_.+\.md$/.test(normalized);
  return true;
}

function linkTarget(link: string): string {
  const raw = link.replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].trim();
  return normalizePath(raw.endsWith(".md") ? raw : `${raw}.md`);
}

export async function inspectVaultIntegrity(app: App): Promise<IntegrityReport> {
  const files = getMarkdownFiles(app);
  const issues: IntegrityIssue[] = [];
  const courses = new Map<string, TFile[]>();
  const references: Array<{ file: TFile; target: string }> = [];
  const lectures = new Map<string, TFile[]>();

  for (const file of files) {
    const fm = frontmatter(app, file);
    const type = String(fm.type ?? "");
    const normalizedPath = normalizePath(file.path);
    const hasCreated = String(fm.created ?? "").trim().length > 0;
    const hasUpdated = String(fm.updated ?? "").trim().length > 0;
    if (MANAGED_TYPES.has(type) && (!hasCreated || !hasUpdated)) {
      issues.push({
        kind: "timestamp",
        path: file.path,
        message: t("integrityTimestamp", {
          fields: `${!hasCreated ? "created" : ""}${!hasCreated && !hasUpdated ? ", " : ""}${!hasUpdated ? "updated" : ""}`,
        }),
        safeFix: true,
      });
    }

    if (MANAGED_TYPES.has(type) && !hasValidManagedLocation(type, file.path)) {
      issues.push({
        kind: "file",
        path: file.path,
        message: t("integrityLocation", { type }),
        safeFix: false,
      });
    }

    if (!type && /^20_University\/\d{4}-[12]\/[^/]+\/[^/]+\.md$/.test(normalizedPath)) {
      const parts = normalizedPath.split("/");
      if (parts[2] === file.parent?.name && file.basename === parts[2]) {
        issues.push({
          kind: "file",
          path: file.path,
          message: t("integrityMissingType"),
          safeFix: false,
        });
      }
    }

    if (type === "university") {
      const key = `${String(fm.semester ?? "").trim()}|${String(fm.courseName ?? "").trim().toLocaleLowerCase()}`;
      if (key !== "|") courses.set(key, [...(courses.get(key) ?? []), file]);
      const schedule = fm.schedule;
      const scheduleValid = Array.isArray(schedule) && schedule.every((item) => {
        if (!item || typeof item !== "object") return false;
        const value = item as { day?: unknown; period?: unknown };
        return /^[월화수목금토일]$/.test(String(value.day ?? "")) && Boolean(parsePeriod(String(value.period ?? "")));
      });
      const courseName = String(fm.courseName ?? "").trim();
      const status = String(fm.status ?? "").trim();
      if (
        !courseName ||
        courseName.includes("{{") ||
        !isValidSemester(fm.semester) ||
        !["studying", "completed", "paused"].includes(status) ||
        !scheduleValid
      ) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityCourseMetadata"),
          safeFix: false,
        });
      }
      const parts = normalizedPath.split("/");
      const pathSemester = parts[1] ?? "";
      const pathCourse = parts[2] ?? "";
      const expectedName = sanitizeFileName(courseName);
      if (pathSemester !== String(fm.semester ?? "").trim()) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integritySemesterMismatch", { metadata: String(fm.semester ?? ""), path: pathSemester }),
          safeFix: false,
        });
      }
      if (pathCourse !== expectedName || file.basename !== expectedName) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityCourseNameMismatch", { path: `${pathCourse}/${file.basename}`, name: courseName }),
          safeFix: false,
        });
      }
    }

    if (type === "lecture") {
      const key = `${String(fm.course ?? "").trim()}|${String(fm.week ?? "").trim()}|${String(fm.date ?? "").trim()}|${String(fm.sessionType ?? "").trim()}`;
      if (key !== "|||") lectures.set(key, [...(lectures.get(key) ?? []), file]);
      const lectureContent = await app.vault.cachedRead(file);
      const body = lectureContent.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
      const meaningful = body
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) =>
          line &&
          !/^#+\s/.test(line) &&
          !/^\[\[.*\]\]$/.test(line) &&
          !/^>\s/.test(line) &&
          !/^-\s*(?:\[[ xX]\])?\s*$/.test(line),
        );
      if (!meaningful.length) {
        issues.push({
          kind: "file",
          path: file.path,
          message: t("integrityEmptyLecture"),
          safeFix: false,
        });
      }
      const lectureParts = normalizedPath.split("/");
      const lectureSemester = lectureParts[1] ?? "";
      if (lectureSemester && String(fm.semester ?? "").trim() && lectureSemester !== String(fm.semester).trim()) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityLectureSemesterMismatch", { metadata: String(fm.semester), path: lectureSemester }),
          safeFix: false,
        });
      }
    }

    if (GENERATED_TYPES.has(type)) {
      const content = await app.vault.cachedRead(file);
      for (const match of content.matchAll(/\[\[([^\]]+)\]\]/g)) {
        const target = linkTarget(match[0]);
        if (target && target !== ".md") references.push({ file, target });
      }
    }
  }

  for (const [key, duplicates] of courses) {
    if (duplicates.length > 1) {
      issues.push({
        kind: "duplicate",
        path: duplicates.map((file) => file.path).join(", "),
        message: t("integrityDuplicateCourse", { count: duplicates.length }),
        safeFix: false,
      });
    }

    if (key.startsWith("|") || key.endsWith("|")) {
      for (const file of duplicates) {
        issues.push({ kind: "course", path: file.path, message: t("integrityEmptyCourse"), safeFix: false });
      }
    }
  }

  for (const [, duplicates] of lectures) {
    if (duplicates.length > 1) {
      issues.push({
        kind: "duplicate",
        path: duplicates.map((file) => file.path).join(", "),
        message: t("integrityDuplicateLecture", { count: duplicates.length }),
        safeFix: false,
      });
    }
  }

  for (const reference of references) {
    if (!app.vault.getAbstractFileByPath(reference.target)) {
      issues.push({
        kind: "reference",
        path: reference.file.path,
        message: t("integrityMissingReference", { target: reference.target }),
        safeFix: false,
      });
    }
  }

  return { issues, checkedFiles: files.length, fixed: 0 };
}

export async function fixSafeIntegrityIssues(app: App, report: IntegrityReport): Promise<IntegrityReport> {
  let fixed = 0;
  for (const issue of report.issues) {
    if (!issue.safeFix || issue.kind !== "timestamp") continue;
    const file = app.vault.getAbstractFileByPath(issue.path);
    if (!(file instanceof TFile)) continue;
    await updateManagedFileTimestamp(app, file);
    fixed += 1;
  }
  return { ...report, fixed };
}
