import { HOME_TEMPLATE } from "../templates/index.ts";

const MANAGED_HOME_HEADINGS = new Set([
  "오늘 할 일",
  "이번 주 시험·수업",
  "수강 과목",
]);

function isManagedHomeHeading(line: string): boolean {
  const heading = line.replace(/^##\s+/, "").trim();
  return MANAGED_HOME_HEADINGS.has(heading) || /^\d{4}-.+\s+아카이브$/.test(heading);
}

export function migrateHomeContent(content: string): string {
  if (content.includes("```univvault-dashboard")) return content;

  const lines = content.split(/\r?\n/);
  const preserved: string[] = [];
  let skippingManagedSection = false;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      skippingManagedSection = isManagedHomeHeading(line);
      if (skippingManagedSection) continue;
    }
    if (skippingManagedSection) continue;
    if (/^\[\[00_Home\|Home\]\]\s+·/.test(line)) continue;
    if (/^>\s*명령 팔레트\s*\/\s*리본:/.test(line)) continue;
    preserved.push(line);
  }

  const normalized = preserved.join("\n").replace(/^#\s+(?:StudyVault|univVault)$/m, "# StudyFlow").trimEnd();
  const dashboard = "```univvault-dashboard\n```";
  const titleMatch = normalized.match(/^#\s+StudyFlow\s*$/m);

  if (!titleMatch || titleMatch.index === undefined) {
    return `${HOME_TEMPLATE.trimEnd()}\n\n${normalized}\n`;
  }

  const insertAt = titleMatch.index + titleMatch[0].length;
  return `${normalized.slice(0, insertAt)}\n\n${dashboard}${normalized.slice(insertAt)}\n`
    .replace(/\n{3,}/g, "\n\n");
}
