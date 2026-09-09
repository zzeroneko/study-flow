import type { App, TFile } from "obsidian";
import {
  filterTasks,
  parseCodeblockOptions,
  parseTasksFromContent,
  sortTasks,
  toggleTaskLine,
  type ParsedTask,
} from "./tasks";
import { todayText } from "../core/constants";
import { getMarkdownFiles, getCachedFileContent } from "../core/vaultIndex";
import { notice } from "../core/vault";
import { t } from "../core/i18n";

export interface VaultTask extends ParsedTask {
  file: TFile;
  path: string;
}

export async function openVaultTask(app: App, task: VaultTask): Promise<void> {
  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(task.file, { state: { mode: "source" } });
  const view = leaf.view as unknown as {
    editor?: {
      setCursor: (position: { line: number; ch: number }) => void;
      scrollIntoView?: (range: { from: { line: number; ch: number }; to: { line: number; ch: number } }, center?: boolean) => void;
    };
  };
  const position = { line: Math.max(0, task.lineIndex), ch: 0 };
  view.editor?.setCursor(position);
  view.editor?.scrollIntoView?.({ from: position, to: position }, true);
}

export async function loadVaultTasks(app: App, pathIncludes?: string | string[]): Promise<VaultTask[]> {
  const pathFilters = typeof pathIncludes === "string" ? [pathIncludes] : pathIncludes ?? [];
  const files = getMarkdownFiles(app).filter((file) => {
    if (!pathFilters.length) return true;
    return pathFilters.some((path) => file.path.includes(path));
  });

  const tasks: VaultTask[] = [];
  for (const file of files) {
    const content = await getCachedFileContent(app, file);
    for (const task of parseTasksFromContent(content)) {
      tasks.push({ ...task, file, path: file.path });
    }
  }
  return tasks;
}

export async function queryTasks(
  app: App,
  source: string,
  defaultPathIncludes?: string[],
): Promise<VaultTask[]> {
  const options = parseCodeblockOptions(source);
  const pathIncludes = options["path includes"] || options.path || "";
  const dueOn = options["due on"] || "";
  const dueToday = options["due today"] === "true" || Object.prototype.hasOwnProperty.call(options, "due today");
  const notDone = options["not done"] === "true" || Object.prototype.hasOwnProperty.call(options, "not done");

  const tasks = await loadVaultTasks(app, pathIncludes || defaultPathIncludes);
  return sortTasks(
    filterTasks(tasks, {
      notDone,
      dueOn: dueOn || undefined,
      dueToday,
      today: todayText(),
    }),
  ) as VaultTask[];
}

export async function toggleVaultTask(app: App, task: VaultTask): Promise<boolean> {
  const content = await app.vault.read(task.file);
  const lines = content.split(/\r?\n/);
  let lineIndex = task.lineIndex;
  if (lineIndex < 0 || lineIndex >= lines.length || lines[lineIndex] !== task.raw) {
    lineIndex = lines.findIndex((line) => line === task.raw);
  }
  if (lineIndex < 0) {
    notice(t("taskToggleFailed"));
    return false;
  }
  lines[lineIndex] = toggleTaskLine(lines[lineIndex]);
  await app.vault.modify(task.file, lines.join("\n"));
  return true;
}
