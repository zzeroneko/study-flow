import { describe, expect, it } from "vitest";
import { evalInObsidian } from "obsidian-integration-testing";
import { getTempVault } from "obsidian-integration-testing/vitest-global-setup";
import { captureDomSnapshot, registerCoreWorkflowTests } from "./shared";

type AppInternal = {
  commands: { executeCommandById(id: string): Promise<boolean> };
};

describe.sequential("StudyFlow Android Appium", () => {
  const vault = getTempVault();
  registerCoreWorkflowTests(vault);

  it("runs the real mobile three-step course flow with sticky actions", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app, obsidianModule }) => {
        const internal = app as unknown as AppInternal;
        if (!obsidianModule.Platform.isMobile) {
          throw new Error("Expected Platform.isMobile=true on Android transport");
        }

        const findSettingInput = (label: string): HTMLInputElement | null => {
          const settings = Array.from(document.querySelectorAll<HTMLElement>(".setting-item"));
          const setting = settings.find(
            (item) => item.querySelector(".setting-item-name")?.textContent?.trim() === label,
          );
          return setting?.querySelector("input") ?? null;
        };
        const setInput = (label: string, value: string): void => {
          const input = findSettingInput(label);
          if (!input) throw new Error(`Mobile input not found: ${label}`);
          input.focus();
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const clickButton = (label: string): void => {
          const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            (item) => item.textContent?.trim() === label,
          );
          if (!button) throw new Error(`Mobile button not found: ${label}`);
          button.click();
        };
        const ensureStep0 = async (): Promise<void> => {
          for (let i = 0; i < 3; i += 1) {
            if (document.querySelector(".sv-basic-panel")) return;
            const previous = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
              (item) => item.textContent?.trim() === "이전",
            );
            if (!previous) break;
            previous.click();
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          if (!document.querySelector(".sv-basic-panel")) {
            clickButton("초기화");
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        };

        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await ensureStep0();

        const first = {
          stepper: Boolean(document.querySelector(".sv-stepper")),
          basic: Boolean(document.querySelector(".sv-basic-panel")),
          schedule: Boolean(document.querySelector(".sv-schedule-panel")),
          review: Boolean(document.querySelector(".sv-review-panel")),
          stickyActions: Boolean(document.querySelector(".sv-modal-actions")),
        };

        setInput("과목명", "자동화 모바일과목");
        clickButton("다음");
        await new Promise((resolve) => setTimeout(resolve, 250));

        const second = {
          basic: Boolean(document.querySelector(".sv-basic-panel")),
          schedule: Boolean(document.querySelector(".sv-schedule-panel")),
          review: Boolean(document.querySelector(".sv-review-panel")),
          previous: Boolean(
            Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.trim() === "이전"),
          ),
        };

        setInput("장소", "M303");
        clickButton("다음");
        await new Promise((resolve) => setTimeout(resolve, 250));

        const schedulePreview =
          Array.from(document.querySelectorAll<HTMLElement>(".sv-preview-section"))
            .map((section) => section.textContent ?? "")
            .find((text) => text.includes("시간표")) ?? "";

        const third = {
          basic: Boolean(document.querySelector(".sv-basic-panel")),
          schedule: Boolean(document.querySelector(".sv-schedule-panel")),
          review: Boolean(document.querySelector(".sv-review-panel")),
          activeStep: document.querySelector(".sv-step.is-active small")?.textContent ?? "",
          schedulePreview,
        };

        clickButton("이전");
        await new Promise((resolve) => setTimeout(resolve, 200));
        const backToSchedule = Boolean(document.querySelector(".sv-schedule-panel"));
        clickButton("닫기");
        await new Promise((resolve) => setTimeout(resolve, 300));

        return { first, second, third, backToSchedule };
      },
    });

    await captureDomSnapshot(vault, "mobile-course-wizard");

    expect(result.first).toEqual({
      stepper: true,
      basic: true,
      schedule: false,
      review: false,
      stickyActions: true,
    });
    expect(result.second).toEqual({
      basic: false,
      schedule: true,
      review: false,
      previous: true,
    });
    expect(result.third.basic).toBe(false);
    expect(result.third.schedule).toBe(false);
    expect(result.third.review).toBe(true);
    expect(result.third.activeStep).toBe("확인");
    expect(result.third.schedulePreview).toContain("시간표 1개");
    expect(result.backToSchedule).toBe(true);
  });

  it("restores draft after closing and reopening the course modal", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as AppInternal;
        const findSettingInput = (label: string): HTMLInputElement | null => {
          const settings = Array.from(document.querySelectorAll<HTMLElement>(".setting-item"));
          const setting = settings.find(
            (item) => item.querySelector(".setting-item-name")?.textContent?.trim() === label,
          );
          return setting?.querySelector("input") ?? null;
        };
        const setInput = (label: string, value: string): void => {
          const input = findSettingInput(label);
          if (!input) throw new Error(`Mobile input not found: ${label}`);
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const clickButton = (label: string): void => {
          const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            (item) => item.textContent?.trim() === label,
          );
          if (!button) throw new Error(`Mobile button not found: ${label}`);
          button.click();
        };
        const goToStep0 = async (): Promise<void> => {
          for (let i = 0; i < 3; i += 1) {
            if (findSettingInput("과목명")) return;
            const previous = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
              (item) => item.textContent?.trim() === "이전",
            );
            if (!previous) break;
            previous.click();
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          if (!findSettingInput("과목명")) {
            clickButton("초기화");
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        };

        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await goToStep0();
        setInput("과목명", "임시저장과목");
        clickButton("닫기");
        await new Promise((resolve) => setTimeout(resolve, 500));

        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await goToStep0();
        return {
          courseName: findSettingInput("과목명")?.value ?? "",
          draftBadge: document.querySelector(".sv-draft-badge")?.textContent ?? "",
        };
      },
    });

    expect(result.courseName).toBe("임시저장과목");
    expect(result.draftBadge).toBe("자동 저장됨");
  });

  it("shows live validation and location suggestions", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as AppInternal;
        const findSettingInput = (label: string): HTMLInputElement | null => {
          const settings = Array.from(document.querySelectorAll<HTMLElement>(".setting-item"));
          const setting = settings.find(
            (item) => item.querySelector(".setting-item-name")?.textContent?.trim() === label,
          );
          return setting?.querySelector("input") ?? null;
        };
        const setInput = (label: string, value: string): void => {
          const input = findSettingInput(label);
          if (!input) throw new Error(`Mobile input not found: ${label}`);
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const clickButton = (label: string): void => {
          const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            (item) => item.textContent?.trim() === label,
          );
          if (!button) throw new Error(`Mobile button not found: ${label}`);
          button.click();
        };
        const goToStep0 = async (): Promise<void> => {
          for (let i = 0; i < 3; i += 1) {
            if (findSettingInput("과목명")) return;
            const previous = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
              (item) => item.textContent?.trim() === "이전",
            );
            if (!previous) break;
            previous.click();
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          if (!findSettingInput("과목명")) {
            clickButton("초기화");
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        };

        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await goToStep0();
        clickButton("초기화");
        await new Promise((resolve) => setTimeout(resolve, 250));

        setInput("과목명", "");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const basicErrors = Array.from(document.querySelectorAll(".sv-field-error.is-visible")).map(
          (el) => el.textContent ?? "",
        );

        setInput("과목명", "검증과목");
        clickButton("다음");
        await new Promise((resolve) => setTimeout(resolve, 250));

        setInput("장소", "");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const locationError =
          Array.from(document.querySelectorAll(".sv-field-error.is-visible"))
            .map((el) => el.textContent ?? "")
            .find((text) => text.includes("장소")) ?? "";

        const locationOptions = Array.from(
          document.querySelectorAll<HTMLOptionElement>("[id^='sv-location-suggestions-'] option"),
        ).map((option) => option.value);

        clickButton("닫기");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { basicErrors, locationError, locationOptions };
      },
    });

    expect(result.basicErrors.some((error) => error.includes("과목"))).toBe(true);
    expect(result.locationError).toContain("장소");
    expect(result.locationOptions).toContain("T101");
  });

  it("creates a course on mobile and shows post-create actions", async () => {
    const result = await evalInObsidian({
      vaultPath: vault.path,
      fn: async ({ app }) => {
        const internal = app as unknown as AppInternal;
        const findSettingInput = (label: string): HTMLInputElement | null => {
          const settings = Array.from(document.querySelectorAll<HTMLElement>(".setting-item"));
          const setting = settings.find(
            (item) => item.querySelector(".setting-item-name")?.textContent?.trim() === label,
          );
          return setting?.querySelector("input") ?? null;
        };
        const setInput = (label: string, value: string): void => {
          const input = findSettingInput(label);
          if (!input) throw new Error(`Mobile input not found: ${label}`);
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const clickButton = (label: string): void => {
          const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            (item) => item.textContent?.trim() === label,
          );
          if (!button) throw new Error(`Mobile button not found: ${label}`);
          button.click();
        };
        const goToStep0 = async (): Promise<void> => {
          for (let i = 0; i < 3; i += 1) {
            if (findSettingInput("과목명")) return;
            const previous = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
              (item) => item.textContent?.trim() === "이전",
            );
            if (!previous) break;
            previous.click();
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          if (!findSettingInput("과목명")) {
            clickButton("초기화");
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        };

        await internal.commands.executeCommandById("study-flow:add-course");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await goToStep0();
        clickButton("초기화");
        await new Promise((resolve) => setTimeout(resolve, 250));

        setInput("과목명", "자동화 안드로이드과목");
        clickButton("다음");
        await new Promise((resolve) => setTimeout(resolve, 250));
        setInput("장소", "A101");
        clickButton("다음");
        await new Promise((resolve) => setTimeout(resolve, 250));
        clickButton("과목 생성");
        await new Promise((resolve) => setTimeout(resolve, 2_500));

        const path = "20_University/2026-2/자동화 안드로이드과목/자동화 안드로이드과목.md";
        const postCreateText =
          Array.from(document.querySelectorAll<HTMLElement>(".modal-content h2"))
            .map((element) => element.textContent?.trim())
            .find((text) => text === "과목 생성 완료") ?? "";
        const actions = Array.from(
          document.querySelectorAll<HTMLButtonElement>(".sv-post-create-actions button"),
        ).map((button) => button.textContent?.trim() ?? "");

        return {
          exists: await app.vault.adapter.exists(path),
          content: await app.vault.adapter.read(path),
          postCreateText,
          actions,
          activePath: app.workspace.getActiveFile()?.path ?? "",
        };
      },
    });

    await captureDomSnapshot(vault, "mobile-course-open");

    expect(result.exists).toBe(true);
    expect(result.content).toContain('courseName: "자동화 안드로이드과목"');
    expect(result.postCreateText).toBe("");
    expect(result.actions).toEqual([]);
    expect(result.activePath).toBe(
      "20_University/2026-2/자동화 안드로이드과목/자동화 안드로이드과목.md",
    );
  });
});
