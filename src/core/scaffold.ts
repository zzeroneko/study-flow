import type { App, TFile } from "obsidian";
import { DAILY_FOLDER, UNIVERSITY_ROOT } from "./constants";
import { createFileIfMissing, ensureFolder } from "./vault";
import { getTemplateSet } from "../templates";
import { migrateHomeContent } from "./homeMigration";

export const CURRENT_SCHEMA_VERSION = 2;
export const HOME_PATH = "00_Home.md";

export async function ensureScaffold(app: App): Promise<void> {
  for (const folder of [
    DAILY_FOLDER,
    UNIVERSITY_ROOT,
  ]) {
    await ensureFolder(app, folder);
  }

  await createFileIfMissing(app, HOME_PATH, getTemplateSet().home);
}

export async function migrateScaffold(app: App, fromVersion: number): Promise<void> {
  if (fromVersion >= CURRENT_SCHEMA_VERSION) return;
  const home = app.vault.getAbstractFileByPath(HOME_PATH);
  if (home && "extension" in home) {
    const file = home as TFile;
    const current = await app.vault.read(file);
    const migrated = migrateHomeContent(current);
    if (migrated !== current) await app.vault.modify(file, migrated);
  }
}
