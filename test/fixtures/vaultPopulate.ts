import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pluginRoot = process.cwd();
const vaultRoot = resolve(pluginRoot, "../../..");
const cursorIntegrationRoot = resolve(pluginRoot, "../cursor-integration");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

export function currentKoreanDay(): string {
  return ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];
}

function sampleCourseNote(): string {
  const day = currentKoreanDay();
  return `---
type: university
semester: "2026-2"
courseName: "자동화 기존과목"
courseField: "major"
courseRequirement: "required"
credits: 3
status: studying
professors: []
schedule:
  - id: "${day}1"
    day: "${day}"
    period: "1"
    location: "T101"
    online: false
tags:
  - university
---

# 자동화 기존과목
`;
}

function sharedVaultFiles(): Record<string, string> {
  return {
    "00_Home.md": read(resolve(vaultRoot, "00_Home.md")),
    "00_시작하기.md": read(resolve(vaultRoot, "00_시작하기.md")),
    "20_University/2026-2/자동화 기존과목/자동화 기존과목.md": sampleCourseNote(),
    "20_University/2026-2/00_2026-2 학기.md": "# 2026-2학기\n\n## 과목\n",
    ".obsidian/app.json": JSON.stringify(
      {
        promptDelete: true,
        mobileToolbarCommands: [
          "editor:undo",
          "editor:redo",
          "study-flow:daily",
          "study-flow:lecture",
          "study-flow:add-course",
        ],
      },
      null,
      2,
    ),
  };
}

export function createDesktopPopulate(): Record<string, string> {
  return {
    ...sharedVaultFiles(),
    ".obsidian/community-plugins.json": JSON.stringify(
      ["study-flow", "cursor-integration"],
      null,
      2,
    ),
    ".obsidian/plugins/cursor-integration/main.js": read(resolve(cursorIntegrationRoot, "main.js")),
    ".obsidian/plugins/cursor-integration/manifest.json": read(
      resolve(cursorIntegrationRoot, "manifest.json"),
    ),
  };
}

export function createAndroidPopulate(): Record<string, string> {
  return {
    ...sharedVaultFiles(),
    ".obsidian/community-plugins.json": JSON.stringify(["study-flow"], null, 2),
  };
}
