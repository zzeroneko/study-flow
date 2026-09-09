import type { App, TFile } from "obsidian";
import { normalizePath } from "../core/constants";
import { getMarkdownFiles } from "../core/vaultIndex";

export interface LectureRow {
  file: TFile;
  path: string;
  week: string;
  date: string;
  sessionType: string;
  classDay: string;
  classPeriod: string;
  folder: string;
}

export function loadLectures(app: App, folderPrefix?: string): LectureRow[] {
  return getMarkdownFiles(app)
    .map((file) => {
      const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
      if (fm.type !== "lecture") return null;
      const folder = normalizePath(file.parent?.path ?? "");
      if (folderPrefix && !folder.startsWith(normalizePath(folderPrefix))) return null;
      return {
        file,
        path: file.path,
        week: String(fm.week ?? ""),
        date: String(fm.date ?? "").slice(0, 10),
        sessionType: String(fm.sessionType ?? ""),
        classDay: String(fm.classDay ?? ""),
        classPeriod: String(fm.classPeriod ?? ""),
        folder,
      } satisfies LectureRow;
    })
    .filter((row): row is LectureRow => Boolean(row))
    .sort((a, b) => Number(a.week) - Number(b.week) || a.date.localeCompare(b.date));
}
