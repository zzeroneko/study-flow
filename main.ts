import * as obsidian from "obsidian";
import { Plugin, PluginSettingTab, Setting, TFile, addIcon } from "obsidian";
import { createOrOpenDaily } from "./src/commands/daily";
import { createCourseCommand } from "./src/commands/course";
import { createLectureCommand, createLectureForMatch, createQuickLectureCommand } from "./src/commands/lecture";
import { openCourseViewCommand } from "./src/commands/courseView";
import { IntegrityModal } from "./src/modals/IntegrityModal";
import {
  DEFAULT_PLUGIN_DATA,
  DEFAULT_SUPPORT_URL,
  UnivVaultPluginData,
  UnivVaultStore,
} from "./src/core/pluginData";
import {
  CURRENT_SCHEMA_VERSION,
  ensureScaffold,
  migrateScaffold,
} from "./src/core/scaffold";
import { updateManagedFileTimestamp } from "./src/core/vault";
import { invalidateVaultIndex } from "./src/core/vaultIndex";
import { registerQueryProcessors } from "./src/query/processors";
import { registerDashboardProcessor } from "./src/processors/DashboardProcessor";
import {
  getDefaultLanguage,
  setLanguage,
  t,
  type PluginLanguage,
} from "./src/core/i18n";

function getObsidianLanguage(): string {
  const api = obsidian as typeof obsidian & { getLanguage?: () => string };
  if (typeof api.getLanguage === "function") return api.getLanguage();
  const locale = (api.moment as { locale?: () => string } | undefined)?.locale?.();
  return locale ?? "";
}

class UnivVaultSettingTab extends PluginSettingTab {
  constructor(app: import("obsidian").App, private plugin: UnivVaultPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName(t("language"))
      .setDesc(t("languageDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOptions({ ko: t("korean"), en: t("english") });
        dropdown.setValue(this.plugin.getData().language);
        dropdown.onChange(async (value) => {
          const language: PluginLanguage = value === "en" ? "en" : "ko";
          setLanguage(language);
          await this.plugin.updateData({ language });
          this.display();
        });
      });
    new Setting(containerEl)
      .setName(t("supportTitle"))
      .setDesc(
        t("supportDesc"),
      )
      .addText((text) => {
        text
          .setPlaceholder(DEFAULT_SUPPORT_URL)
          .setValue(this.plugin.getData().supportUrl)
          .onChange(async (value) => {
            await this.plugin.updateData({ supportUrl: value.trim() || DEFAULT_SUPPORT_URL });
          });
      })
      .addButton((button) => {
        button.setButtonText(t("open"));
        button.onClick(() => {
          const url = this.plugin.getData().supportUrl.trim() || DEFAULT_SUPPORT_URL;
          window.open(url, "_blank");
        });
      });
  }
}

export default class UnivVaultPlugin extends Plugin implements UnivVaultStore {
  private data: UnivVaultPluginData = { ...DEFAULT_PLUGIN_DATA };

  getData(): UnivVaultPluginData {
    return this.data;
  }

  async updateData(patch: Partial<UnivVaultPluginData>): Promise<void> {
    this.data = { ...this.data, ...patch };
    await this.saveData(this.data);
  }

  async onload(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<UnivVaultPluginData> | null;
    this.data = {
      schemaVersion: loaded?.schemaVersion ?? DEFAULT_PLUGIN_DATA.schemaVersion,
      language: loaded?.language === "en" ? "en" : loaded?.language === "ko" ? "ko" : getDefaultLanguage(getObsidianLanguage()),
      courseDraft: loaded?.courseDraft,
      recentLocations: loaded?.recentLocations ?? [],
      recentCoursePaths: loaded?.recentCoursePaths ?? [],
      lastSemester: loaded?.lastSemester ?? DEFAULT_PLUGIN_DATA.lastSemester,
      supportUrl:
        typeof loaded?.supportUrl === "string" && loaded.supportUrl.trim()
          ? loaded.supportUrl.trim()
          : DEFAULT_SUPPORT_URL,
    };
    setLanguage(this.data.language);
    await ensureScaffold(this.app);
    const previousSchemaVersion = loaded?.schemaVersion ?? 0;
    await migrateScaffold(this.app, previousSchemaVersion);
    if (previousSchemaVersion < CURRENT_SCHEMA_VERSION) {
      await this.updateData({ schemaVersion: CURRENT_SCHEMA_VERSION });
    }

    addIcon(
      "univvault-book",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    );
    registerQueryProcessors(this);
    registerDashboardProcessor(this, {
      daily: () => createOrOpenDaily(this.app),
      lecture: () => createLectureCommand(this.app, this),
      quickLecture: () => createQuickLectureCommand(this.app, this),
      lectureForMatch: (match) => createLectureForMatch(this.app, match, this),
      courseView: () => openCourseViewCommand(this.app, this),
      integrity: async () => new IntegrityModal(this.app).open(),
      addCourse: () => createCourseCommand(this.app, this),
    });
    this.addSettingTab(new UnivVaultSettingTab(this.app, this));

    this.addRibbonIcon("univvault-book", `StudyFlow: ${t("lecture")}`, async () => {
      await createLectureCommand(this.app, this);
    });
    this.addRibbonIcon("univvault-book", `StudyFlow: ${t("addCourse")}`, async () => {
      await createCourseCommand(this.app, this);
    });

    this.addCommand({
      id: "daily",
      name: t("daily"),
      callback: async () => {
        await createOrOpenDaily(this.app);
      },
    });

    this.addCommand({
      id: "lecture",
      name: t("lecture"),
      callback: async () => {
        await createLectureCommand(this.app, this);
      },
    });

    this.addCommand({
      id: "quick-lecture",
      name: t("quickLecture"),
      callback: async () => {
        await createQuickLectureCommand(this.app, this);
      },
    });

    this.addCommand({
      id: "course-view",
      name: t("courseView"),
      callback: async () => {
        await openCourseViewCommand(this.app, this);
      },
    });

    this.addCommand({
      id: "check-integrity",
      name: t("integrity"),
      callback: () => {
        new IntegrityModal(this.app).open();
      },
    });

    this.addCommand({
      id: "add-course",
      name: t("addCourse"),
      callback: async () => {
        await createCourseCommand(this.app, this);
      },
    });


    this.app.workspace.onLayoutReady(() => {
      void this.openHomeIfNeeded();
    });

    this.registerEvent(this.app.vault.on("modify", (file) => {
        invalidateVaultIndex(this.app, file.path);
        if (file instanceof TFile) {
          void updateManagedFileTimestamp(this.app, file).catch((error) => {
            console.error("univVault timestamp update failed", error);
          });
        }
      }));
    this.registerEvent(this.app.vault.on("delete", (file) => invalidateVaultIndex(this.app, file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
        invalidateVaultIndex(this.app, oldPath);
        invalidateVaultIndex(this.app, file.path);
      }));
  }

  private async openHomeIfNeeded(): Promise<void> {
    const home = this.app.vault.getAbstractFileByPath("00_Home.md");
    if (!home || !(home instanceof TFile)) return;

    const hasOpenMarkdown = this.app.workspace
      .getLeavesOfType("markdown")
      .some((leaf) => Boolean((leaf.view as { file?: TFile }).file));
    if (hasOpenMarkdown) return;

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(home, { state: { mode: "preview" } });
  }

}
