import { Modal, type App } from "obsidian";
import {
  fixSafeIntegrityIssues,
  inspectVaultIntegrity,
  type IntegrityIssue,
  type IntegrityReport,
} from "../core/integrity";
import { t } from "../core/i18n";

export class IntegrityModal extends Modal {
  private report: IntegrityReport | null = null;

  onOpen(): void {
    this.modalEl.addClass("sv-integrity-modal");
    this.titleEl.setText(t("integrityTitle"));
    void this.scan();
  }

  private async scan(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.createEl("p", { text: t("integrityScanning"), cls: "sv-modal-desc" });
    this.report = await inspectVaultIntegrity(this.app);
    this.render();
  }

  private render(): void {
    if (!this.report) return;
    this.contentEl.empty();
    const safe = this.report.issues.filter((issue) => issue.safeFix);
    this.contentEl.createEl("p", {
      text: t("integritySummary", { files: this.report.checkedFiles, issues: this.report.issues.length }),
      cls: "sv-modal-desc",
    });
    if (!this.report.issues.length) {
      this.contentEl.createEl("p", { text: t("integrityNone"), cls: "sv-integrity-success" });
    } else {
      const list = this.contentEl.createEl("ul", { cls: "sv-integrity-list" });
      for (const issue of this.report.issues.slice(0, 100)) {
        const item = list.createEl("li");
        item.createEl("strong", { text: `[${labelFor(issue)}] ` });
        item.createSpan({ text: issue.message });
        item.createEl("small", { text: ` · ${issue.path}`, cls: "sv-integrity-path" });
      }
      if (this.report.issues.length > 100) {
        this.contentEl.createEl("p", { text: t("integrityFirst100"), cls: "sv-modal-desc" });
      }
    }

    const actions = this.contentEl.createDiv({ cls: "sv-modal-actions" });
    const rescan = actions.createEl("button", { text: t("rescan"), cls: "sv-btn sv-btn-ghost" });
    rescan.addEventListener("click", () => void this.scan());
    if (safe.length) {
      const fix = actions.createEl("button", { text: t("applySafeFixes", { count: safe.length }), cls: "sv-btn sv-btn-primary" });
      fix.addEventListener("click", async () => {
        if (!this.report) return;
        this.report = await fixSafeIntegrityIssues(this.app, this.report);
        await this.scan();
      });
    }
  }
}

function labelFor(issue: IntegrityIssue): string {
  return {
    timestamp: "timestamp",
    course: "course metadata",
    reference: "generated reference",
    duplicate: "duplicate",
    file: "file location",
  }[issue.kind];
}
