import type { App, TFile } from "obsidian";

interface TaskCacheEntry {
  mtime: number;
  size: number;
  content: string;
}

interface VaultIndex {
  markdownFiles: TFile[] | null;
  taskContent: Map<string, TaskCacheEntry>;
}

const indexes = new WeakMap<App, VaultIndex>();

function getIndex(app: App): VaultIndex {
  const existing = indexes.get(app);
  if (existing) return existing;
  const index: VaultIndex = { markdownFiles: null, taskContent: new Map() };
  indexes.set(app, index);
  return index;
}

export function getMarkdownFiles(app: App): TFile[] {
  const index = getIndex(app);
  if (!index.markdownFiles) index.markdownFiles = app.vault.getMarkdownFiles();
  return index.markdownFiles;
}

export async function getCachedFileContent(app: App, file: TFile): Promise<string> {
  const index = getIndex(app);
  const cached = index.taskContent.get(file.path);
  if (cached && cached.mtime === file.stat.mtime && cached.size === file.stat.size) {
    return cached.content;
  }
  const content = await app.vault.cachedRead(file);
  index.taskContent.set(file.path, { mtime: file.stat.mtime, size: file.stat.size, content });
  return content;
}

export function invalidateVaultIndex(app: App, path?: string): void {
  const index = getIndex(app);
  index.markdownFiles = null;
  if (path) index.taskContent.delete(path);
  else index.taskContent.clear();
}
