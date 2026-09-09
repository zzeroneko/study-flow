import type { App, TFile } from "obsidian";
import { PERSONAL_STUDY_ROOT, normalizePath } from "../core/constants";
import { getMarkdownFiles } from "../core/vaultIndex";

export interface PersonalStudyNote {
  file: TFile;
  path: string;
  title: string;
  modified: number;
}

export function loadPersonalStudyNotes(app: App): PersonalStudyNote[] {
  return getMarkdownFiles(app)
    .filter((file) => normalizePath(file.path).startsWith(`${PERSONAL_STUDY_ROOT}/`))
    .map((file) => ({
      file,
      path: file.path,
      title: file.basename,
      modified: file.stat.mtime,
    }))
    .sort((a, b) => b.modified - a.modified || a.title.localeCompare(b.title, "ko"));
}
