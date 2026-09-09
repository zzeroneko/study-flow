import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { evalInObsidian } from "obsidian-integration-testing";
import type { TempVault } from "obsidian-integration-testing";

type AppInternal = {
  plugins: { enabledPlugins: Set<string> };
  commands: {
    commands: Record<string, unknown>;
    executeCommandById(id: string): Promise<boolean>;
  };
};

export function registerCoreWorkflowTests(vault: TempVault): void {
  it("loads the plugin and registers the core commands", async () => {
    const state = await evalInObsidian({
      vaultPath: vault.path,
      fn: ({ app }) => {
        const internal = app as unknown as AppInternal;
        return {
          enabled: internal.plugins.enabledPlugins.has("study-flow"),
          commands: [
            "study-flow:daily",
            "study-flow:lecture",
            "study-flow:add-course",
          ].filter((id) => Boolean(internal.commands.commands[id])),
        };
      },
    });

    expect(state.enabled).toBe(true);
    expect(state.commands).toHaveLength(3);
  });

  it("renders univvault query blocks on Home", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app, obsidianModule }) => {
        const file = app.vault.getAbstractFileByPath("00_Home.md");
        if (!file || !("extension" in file)) throw new Error("00_Home.md missing");
        await app.workspace.getLeaf(false).openFile(file as import("obsidian").TFile, {
          state: { mode: "preview" },
        });
        await new Promise((resolve) => setTimeout(resolve, 900));
        const dashboardEl = document.querySelector<HTMLElement>(".sv-dashboard");
        const actionsEl = dashboardEl?.querySelector<HTMLElement>(".sv-dashboard-actions") ?? null;
        return {
          dashboard: Boolean(dashboardEl),
          actions: dashboardEl?.querySelectorAll(".sv-dashboard-action").length ?? 0,
          actionColumns: actionsEl
            ? getComputedStyle(actionsEl).gridTemplateColumns.split(" ").filter(Boolean).length
            : 0,
          mobile: obsidianModule.Platform.isMobile,
          homeOpen: app.workspace.getActiveFile()?.path === "00_Home.md",
          content: await app.vault.adapter.read("00_Home.md"),
          dashboardText: dashboardEl?.textContent ?? "",
        };
      },
    });

    expect(result.homeOpen).toBe(true);
    expect(result.content).toContain("univvault-dashboard");
    expect(result.content).not.toContain("```dataview");
    expect(result.dashboard).toBe(true);
    expect(result.actions).toBe(6);
    expect(result.mobile ? result.actionColumns : result.actionColumns > 1).toBe(
      result.mobile ? 1 : true,
    );
  });

  it("creates a Daily note containing today's class", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as AppInternal;
        await internal.commands.executeCommandById("study-flow:daily");
        await new Promise((resolve) => setTimeout(resolve, 700));
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate(),
        ).padStart(2, "0")}`;
        const path = `10_Daily/${date}.md`;
        return {
          exists: await app.vault.adapter.exists(path),
          content: await app.vault.adapter.read(path),
        };
      },
    });

    expect(result.exists).toBe(true);
    expect(result.content).toContain("## 오늘 수업");
    expect(result.content).toContain("자동화 기존과목");
    expect(result.content).not.toContain("{{TODAY_CLASSES}}");
  });

  it("creates today's lecture directly from its dashboard row", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const home = app.vault.getAbstractFileByPath("00_Home.md");
        if (!home || !("extension" in home)) throw new Error("00_Home.md missing");
        await app.workspace.getLeaf(false).openFile(home as import("obsidian").TFile, {
          state: { mode: "preview" },
        });
        await new Promise((resolve) => setTimeout(resolve, 700));
        const row = document.querySelector<HTMLButtonElement>(".sv-dashboard-timetable-row");
        if (!row) throw new Error("Today's class row missing");
        row.click();
        await new Promise((resolve) => setTimeout(resolve, 900));
        const day = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];
        const path = `20_University/2026-2/자동화 기존과목/Lectures/01주차-${day}1.md`;
        return {
          exists: await app.vault.adapter.exists(path),
          content: await app.vault.adapter.read(path),
        };
      },
    });

    expect(result.exists).toBe(true);
    expect(result.content).toContain("type: lecture");
    expect(result.content).toContain("자동화 기존과목");
  });

  it("creates a lecture after only one course choice when no class matches today", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as AppInternal;
        const coursePath = "20_University/2026-2/자동화 기존과목/자동화 기존과목.md";
        const course = app.vault.getAbstractFileByPath(coursePath);
        if (!course || !("extension" in course)) throw new Error("Course fixture missing");
        const file = course as import("obsidian").TFile;
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        const today = days[new Date().getDay()];
        const other = days[(new Date().getDay() + 1) % 7];
        const content = (await app.vault.read(file))
          .replace(`id: "${today}1"`, `id: "${other}1"`)
          .replace(`day: "${today}"`, `day: "${other}"`);
        await app.vault.modify(file, content);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await internal.commands.executeCommandById("study-flow:lecture");
        await new Promise((resolve) => setTimeout(resolve, 900));
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate(),
        ).padStart(2, "0")}`;
        const path = `20_University/2026-2/자동화 기존과목/Lectures/01주차-${date}.md`;
        return {
          exists: await app.vault.adapter.exists(path),
          content: await app.vault.adapter.read(path),
        };
      },
    });

    expect(result.exists).toBe(true);
    expect(result.content).toContain("type: lecture");
    expect(result.content).toContain('sessionType: "extra"');
    expect(result.content).toContain('classDay: ""');
    expect(result.content).toContain('classPeriod: ""');
  });

}

export async function captureArtifact(
  vault: TempVault,
  name: string,
  html: string,
): Promise<string> {
  const dir = join(process.cwd(), "test-artifacts", "android");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${name}.html`);
  await writeFile(path, html, "utf8");
  return path;
}

export async function captureDomSnapshot(vault: TempVault, name: string): Promise<string> {
  const html = await evalInObsidian({
    vaultPath: vault.path,
    fn: () => document.documentElement.outerHTML,
  });
  return captureArtifact(vault, name, html);
}
