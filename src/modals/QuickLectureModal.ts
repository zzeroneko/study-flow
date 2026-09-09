import { Modal, Setting, type App } from "obsidian";
import { t } from "../core/i18n";

export interface QuickLectureFormResult {
  title: string;
  content: string;
  task: string;
}

export class QuickLectureModal extends Modal {
  private title = "";
  private content = "";
  private task = "";

  constructor(
    app: App,
    private courseName: string,
    private onSubmit: (result: QuickLectureFormResult) => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("sv-quick-lecture-modal");
    this.titleEl.setText(t("quickTitle"));
    this.contentEl.empty();
    this.contentEl.createEl("p", {
      text: t("quickDesc", { course: this.courseName }),
      cls: "sv-modal-desc",
    });

    new Setting(this.contentEl)
      .setName(t("title"))
      .setDesc(t("lectureTitleDesc"))
      .addText((input) => {
        input.setPlaceholder(t("titlePlaceholder"));
        input.setValue(this.title);
        input.inputEl.focus();
        input.onChange((value) => (this.title = value));
      });

    new Setting(this.contentEl)
      .setName(t("content"))
      .setDesc(t("contentDesc"))
      .addTextArea((input) => {
        input.setPlaceholder(t("contentPlaceholder"));
        input.setValue(this.content);
        input.inputEl.rows = 8;
        input.onChange((value) => (this.content = value));
      });

    new Setting(this.contentEl)
      .setName(t("optionalTask"))
      .setDesc(t("taskDesc"))
      .addText((input) => {
        input.setPlaceholder(t("taskPlaceholder"));
        input.setValue(this.task);
        input.onChange((value) => (this.task = value));
      });

    const actions = this.contentEl.createDiv({ cls: "sv-modal-actions" });
    const cancel = actions.createEl("button", { text: t("cancel"), cls: "sv-btn sv-btn-ghost" });
    cancel.addEventListener("click", () => this.close());
    const save = actions.createEl("button", { text: t("saveRecord"), cls: "sv-btn sv-btn-primary" });
    save.addEventListener("click", () => {
      void this.submit();
    });
    this.scope.register([], "Mod", () => {
      void this.submit();
      return false;
    });
  }

  private async submit(): Promise<void> {
    const title = this.title.trim();
    if (!title) {
      this.contentEl.querySelector("input")?.focus();
      return;
    }
    await this.onSubmit({ title, content: this.content.trim(), task: this.task.trim() });
    this.close();
  }
}
