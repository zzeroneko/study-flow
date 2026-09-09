import { join } from "node:path";
import { readFile } from "node:fs/promises";
import WebSocket from "ws";
import { describe, expect, it } from "vitest";
import { evalInObsidian } from "obsidian-integration-testing";
import { getTempVault } from "obsidian-integration-testing/vitest-global-setup";
import { registerCoreWorkflowTests } from "./shared";

interface PreviewResponse {
  type: string;
  html?: string;
  css?: string;
  protocolVersion?: number;
  message?: string;
}

async function previewRequest(request: Record<string, unknown>, retries = 15): Promise<PreviewResponse> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await new Promise<PreviewResponse>((resolve, reject) => {
        const socket = new WebSocket("ws://127.0.0.1:27123");
        const timeout = setTimeout(() => {
          socket.terminate();
          reject(new Error("Obsidian for Cursor response timeout"));
        }, 15_000);
        socket.once("open", () => socket.send(JSON.stringify(request)));
        socket.once("message", (data) => {
          clearTimeout(timeout);
          const response = JSON.parse(data.toString()) as PreviewResponse;
          socket.close();
          resolve(response);
        });
        socket.once("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Obsidian for Cursor connection failed");
}

describe.sequential("univVault desktop CDP", () => {
  const vault = getTempVault();
  registerCoreWorkflowTests(vault);

  it("renders the desktop two-column course modal", async () => {
    const modal = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as {
          commands: { executeCommandById(id: string): Promise<boolean> };
        };
        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 300));
        const result = {
          shell: Boolean(document.querySelector(".sv-course-modal-shell")),
          grid: Boolean(document.querySelector(".sv-desktop-grid")),
          basic: Boolean(document.querySelector(".sv-basic-panel")),
          schedule: Boolean(document.querySelector(".sv-schedule-panel")),
          review: Boolean(document.querySelector(".sv-review-panel")),
          settingLabels: Array.from(document.querySelectorAll<HTMLElement>(".sv-course-modal .setting-item-name")).map(
            (item) => item.textContent?.trim() ?? "",
          ),
          draftBadge: document.querySelector(".sv-draft-badge")?.textContent ?? "",
        };
        document.querySelector<HTMLButtonElement>(".modal-close-button")?.click();
        return result;
      },
    });

    expect(modal).toEqual({
      shell: true,
      grid: true,
      basic: true,
      schedule: true,
      review: true,
      settingLabels: ["학기", "과목명", "요일", "교시", "온라인", "장소"],
      draftBadge: "자동 저장됨",
    });
  });

  it("submits the modal and opens the course without another modal", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const findSettingInput = (label: string): HTMLInputElement | null => {
          const settings = Array.from(document.querySelectorAll<HTMLElement>(".setting-item"));
          const setting = settings.find(
            (item) => item.querySelector(".setting-item-name")?.textContent?.trim() === label,
          );
          return setting?.querySelector("input") ?? null;
        };
        const setInput = (input: HTMLInputElement | null, value: string): void => {
          if (!input) throw new Error(`Input not found: ${value}`);
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };

        setInput(findSettingInput("과목명"), "자동화 신규과목");
        setInput(findSettingInput("장소"), "T202");
        const createButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) => button.textContent?.trim() === "과목 생성",
        );
        if (!createButton) throw new Error("Create button not found");
        createButton.click();
        await new Promise((resolve) => setTimeout(resolve, 1_500));

        const path = "20_University/2026-2/자동화 신규과목/자동화 신규과목.md";
        const postCreateText =
          Array.from(document.querySelectorAll<HTMLElement>(".modal-content h2"))
            .map((element) => element.textContent?.trim())
            .find((text) => text === "과목 생성 완료") ?? "";
        const actions = Array.from(
          document.querySelectorAll<HTMLButtonElement>(".sv-post-create-actions button"),
        ).map((button) => button.textContent?.trim() ?? "");

        return {
          exists: await app.vault.adapter.exists(path),
          postCreateText,
          actions,
          activePath: app.workspace.getActiveFile()?.path ?? "",
        };
      },
    });

    expect(result.exists).toBe(true);
    expect(result.postCreateText).toBe("");
    expect(result.actions).toEqual([]);
    expect(result.activePath).toBe("20_University/2026-2/자동화 신규과목/자동화 신규과목.md");
  });

  it("renders the dashboard through Obsidian for Cursor", async () => {
    const settings = await previewRequest({ type: "getSettings" });
    expect(settings.type).toBe("settings");
    expect(settings.protocolVersion).toBe(2);

    const filePath = join(vault.path, "00_Home.md");
    const content = await readFile(filePath, "utf8");
    const rendered = await previewRequest({
      type: "render",
      filePath,
      content,
    });

    expect(rendered.type).toBe("render");
    expect(rendered.html).toContain("univVault");
    expect(rendered.html).toContain("오늘 과제");
    expect(rendered.css?.length).toBeGreaterThan(1_000);
  });
});
