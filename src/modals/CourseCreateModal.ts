import { App, Modal, Notice, Platform, Setting } from "obsidian";
import {
  type CourseSchedule,
  DAYS,
  getDefaultSemesters,
  makeScheduleId,
  parsePeriod,
  periodToTime,
  sanitizeFileName,
  UNIVERSITY_ROOT,
} from "../core/constants";
import type { CourseDraft } from "../core/pluginData";
import { dayLabel, t } from "../core/i18n";

export interface CourseFormResult {
  semester: string;
  courseName: string;
  schedules: CourseSchedule[];
}

export class CourseCreateModal extends Modal {
  private result: CourseFormResult;
  private step: number;
  private submitted = false;
  private submitting = false;
  private touched = new Set<string>();
  private draftTimer: number | null = null;
  private draftSaveChain: Promise<void> = Promise.resolve();

  constructor(
    app: App,
    private locations: string[],
    draft: CourseDraft,
    private onDraft: (draft: CourseDraft) => Promise<void>,
    private onSubmit: (data: CourseFormResult | null) => void,
  ) {
    super(app);
    this.result = {
      semester: draft.semester || getDefaultSemesters()[1],
      courseName: draft.courseName,
      schedules: draft.schedules.length
        ? draft.schedules.map((schedule) => ({ ...schedule }))
        : [{ day: "월", period: "1", location: "", online: false }],
    };
    this.step = Math.min(Math.max(draft.step ?? 0, 0), 2);
  }

  onOpen(): void {
    this.modalEl.addClass("sv-course-modal-shell");
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("sv-course-modal");

    const header = contentEl.createDiv({ cls: "sv-modal-header" });
    const titleWrap = header.createDiv();
    titleWrap.createEl("h2", { text: t("addCourse") });
    titleWrap.createEl("p", {
      text: Platform.isMobile
        ? t("addCourseDescMobile")
        : t("addCourseDesc"),
      cls: "sv-modal-desc",
    });
    header.createEl("span", { text: t("autosaved"), cls: "sv-draft-badge" });

    if (Platform.isMobile) this.renderStepper(contentEl);
    const body = contentEl.createDiv({
      cls: Platform.isMobile ? "sv-wizard-body" : "sv-desktop-grid",
    });
    if (!Platform.isMobile || this.step === 0) this.renderBasicPanel(body);
    if (!Platform.isMobile || this.step === 1) this.renderSchedulePanel(body);
    if (!Platform.isMobile || this.step === 2) this.renderReviewPanel(body);
    this.renderActions(contentEl);
  }

  private renderStepper(container: HTMLElement): void {
    const stepper = container.createDiv({ cls: "sv-stepper" });
    [t("subject"), t("timetable"), t("review")].forEach((label, index) => {
      const item = stepper.createDiv({
        cls: `sv-step ${index === this.step ? "is-active" : ""} ${index < this.step ? "is-done" : ""}`,
      });
      item.createEl("span", { text: String(index + 1), cls: "sv-step-number" });
      item.createEl("small", { text: label });
    });
  }

  private renderBasicPanel(container: HTMLElement): void {
    const panel = container.createDiv({ cls: "sv-panel sv-basic-panel" });
    panel.createEl("h3", { text: t("subject") });

    new Setting(panel).setName(t("semester")).addDropdown((dropdown) => {
      const semesters = getDefaultSemesters();
      if (this.result.semester && !semesters.includes(this.result.semester)) {
        semesters.unshift(this.result.semester);
      }
      semesters.forEach((semester) => dropdown.addOption(semester, semester));
      dropdown.setValue(this.result.semester);
      dropdown.onChange((value) => {
        this.result.semester = value;
        this.scheduleDraftSave();
        this.render();
      });
    });

    const nameSetting = new Setting(panel).setName(t("courseName")).addText((text) => {
      text.setPlaceholder(t("courseNamePlaceholder"));
      text.setValue(this.result.courseName);
      text.onChange((value) => {
        this.result.courseName = value.trim();
        this.touched.add("courseName");
        this.updateInlineError(nameSetting.settingEl, "courseName");
        this.scheduleDraftSave();
      });
    });
    this.addErrorSlot(nameSetting.settingEl, "courseName");
    this.updateInlineError(nameSetting.settingEl, "courseName");
  }

  private renderSchedulePanel(container: HTMLElement): void {
    const panel = container.createDiv({ cls: "sv-panel sv-schedule-panel" });
    const heading = panel.createDiv({ cls: "sv-panel-heading" });
    heading.createEl("h3", { text: t("timetable") });
    const addButton = heading.createEl("button", { text: t("add"), cls: "sv-small-button" });
    addButton.addEventListener("click", () => {
      const previous = this.result.schedules.at(-1);
      this.result.schedules.push({
        day: previous?.day ?? "월",
        period: previous?.period ?? "1",
        location: previous?.location ?? "",
        online: previous?.online ?? false,
      });
      this.scheduleDraftSave();
      this.render();
    });

    const list = panel.createDiv({ cls: "sv-schedule-list" });
    this.result.schedules.forEach((schedule, index) => this.renderScheduleRow(list, schedule, index));
    if (!this.result.schedules.length) {
      list.createEl("p", { text: t("addSchedule"), cls: "sv-empty-state" });
    }
  }

  private renderScheduleRow(container: HTMLElement, schedule: CourseSchedule, index: number): void {
    const row = container.createDiv({ cls: "sv-schedule-row" });
    const rowHeader = row.createDiv({ cls: "sv-schedule-row-header" });
    rowHeader.createEl("strong", { text: t("schedule", { index: index + 1 }) });
    const remove = rowHeader.createEl("button", { text: t("remove"), cls: "sv-link-button is-danger" });
    remove.addEventListener("click", () => {
      this.result.schedules.splice(index, 1);
      this.scheduleDraftSave();
      this.render();
    });

    const daySetting = new Setting(row).setName(t("day"));
    const dayControl = daySetting.controlEl.createDiv({ cls: "sv-day-chips" });
    DAYS.forEach((day) => {
      const button = dayControl.createEl("button", {
        text: dayLabel(day),
        cls: `sv-day-chip ${schedule.day === day ? "is-selected" : ""}`,
      });
      button.addEventListener("click", () => {
        schedule.day = day;
        this.scheduleDraftSave();
        this.render();
      });
    });

    const periodSetting = new Setting(row).setName(t("periodLabel")).addText((text) => {
      text.setPlaceholder(t("periodPlaceholder"));
      text.setValue(schedule.period);
      text.onChange((value) => {
        schedule.period = value;
        this.touched.add(`period-${index}`);
        periodSetting.descEl.setText(periodToTime(value) || t("periodHint"));
        this.updateInlineError(periodSetting.settingEl, `period-${index}`);
        this.scheduleDraftSave();
      });
    });
    this.addErrorSlot(periodSetting.settingEl, `period-${index}`);
    periodSetting.descEl.setText(periodToTime(schedule.period) || t("periodHint"));
    this.updateInlineError(periodSetting.settingEl, `period-${index}`);

    new Setting(row).setName(t("onlineLabel")).addToggle((toggle) => {
      toggle.setValue(Boolean(schedule.online));
      toggle.onChange((value) => {
        schedule.online = value;
        if (value) schedule.location = "";
        this.scheduleDraftSave();
        this.render();
      });
    });

    if (!schedule.online) {
      const listId = `sv-location-suggestions-${index}`;
      const datalist = row.createEl("datalist", { attr: { id: listId } });
      this.locations.forEach((location) => datalist.createEl("option", { attr: { value: location } }));
      const locationSetting = new Setting(row).setName(t("location")).addText((text) => {
        text.setPlaceholder(t("locationPlaceholder"));
        text.setValue(schedule.location ?? "");
        text.inputEl.setAttr("list", listId);
        text.onChange((value) => {
          schedule.location = value.trim();
          this.touched.add(`location-${index}`);
          this.updateInlineError(locationSetting.settingEl, `location-${index}`);
          this.scheduleDraftSave();
        });
      });
      this.addErrorSlot(locationSetting.settingEl, `location-${index}`);
      this.updateInlineError(locationSetting.settingEl, `location-${index}`);
    }
  }

  private renderReviewPanel(container: HTMLElement): void {
    const panel = container.createDiv({ cls: "sv-panel sv-review-panel" });
    panel.createEl("h3", { text: t("review") });
    const errors = this.validateAll();
    if (errors.length) {
      const box = panel.createDiv({ cls: "sv-validation-summary" });
      box.createEl("strong", { text: errors[0] });
    }

    const summary = panel.createDiv({ cls: "sv-review-card" });
    this.addReviewRow(summary, t("semester"), this.result.semester);
    this.addReviewRow(summary, t("subject"), this.result.courseName || t("notEntered"));
    const scheduleSection = panel.createDiv({ cls: "sv-preview-section" });
    scheduleSection.createEl("h4", { text: t("countSchedules", { count: this.result.schedules.length }) });
    const list = scheduleSection.createEl("ul");
    this.result.schedules.forEach((schedule) => {
      list.createEl("li", {
        text: [
          schedule.day,
          t("period", { period: schedule.period }),
          periodToTime(schedule.period),
          schedule.online ? t("online") : schedule.location,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    });
    panel.createEl("p", {
      text: t("generatedLocation", { path: `${UNIVERSITY_ROOT}/${this.result.semester}/${sanitizeFileName(this.result.courseName || t("courseName"))}` }),
      cls: "sv-path-preview",
    });
  }

  private renderActions(container: HTMLElement): void {
    const actions = container.createDiv({ cls: "sv-modal-actions" });
    const left = actions.createDiv({ cls: "sv-action-group" });
    const right = actions.createDiv({ cls: "sv-action-group" });
    const reset = left.createEl("button", { text: t("reset"), cls: "sv-btn sv-btn-ghost" });
    reset.addEventListener("click", () => {
      this.result.semester = getDefaultSemesters()[1];
      this.result.courseName = "";
      this.result.schedules = [{ day: "월", period: "1", location: "", online: false }];
      this.step = 0;
      this.touched.clear();
      this.scheduleDraftSave();
      this.render();
    });
    const cancel = left.createEl("button", { text: t("close"), cls: "sv-btn" });
    cancel.addEventListener("click", () => {
      this.close();
      this.onSubmit(null);
    });

    if (Platform.isMobile && this.step > 0) {
      const previous = right.createEl("button", { text: t("previous"), cls: "sv-btn" });
      previous.addEventListener("click", () => {
        this.step -= 1;
        this.scheduleDraftSave();
        this.render();
      });
    }
    if (Platform.isMobile && this.step < 2) {
      const next = right.createEl("button", { text: t("next"), cls: "sv-btn sv-btn-primary" });
      next.addEventListener("click", () => {
        const errors = this.step === 0 ? this.validateBasic() : this.validateSchedules();
        if (errors.length) {
          this.markStepTouched(this.step);
          new Notice(errors[0]);
          this.render();
          return;
        }
        this.step += 1;
        this.scheduleDraftSave();
        this.render();
      });
    } else {
      const create = right.createEl("button", { text: t("createCourse"), cls: "sv-btn sv-btn-primary" });
      create.addEventListener("click", () => void this.submit());
    }
  }

  private async submit(): Promise<void> {
    if (this.submitting) return;
    const errors = this.validateAll();
    if (errors.length) {
      this.markStepTouched(0);
      this.markStepTouched(1);
      new Notice(errors[0]);
      if (Platform.isMobile) {
        this.step = this.validateBasic().length ? 0 : 1;
      }
      this.render();
      return;
    }
    this.result.schedules.forEach((schedule) => {
      schedule.period = parsePeriod(schedule.period)!.text;
      schedule.id = makeScheduleId(schedule.day, schedule.period);
      schedule.location = schedule.location?.trim() ?? "";
    });
    this.submitting = true;
    await this.flushDraft();
    this.submitted = true;
    this.close();
    this.onSubmit(this.result);
  }

  private validateBasic(): string[] {
    const errors: string[] = [];
    if (!this.result.semester.trim()) errors.push(t("selectSemester"));
    if (!/^\d{4}-[12]$/.test(this.result.semester)) errors.push(t("semesterFormat"));
    if (!this.result.courseName.trim()) errors.push(t("enterCourseName"));
    if (this.result.courseName.trim()) {
      const folder = sanitizeFileName(this.result.courseName);
      if (!folder || folder === "." || folder === "..") {
        errors.push(t("validCourseName"));
        return errors;
      }
      const path = `${UNIVERSITY_ROOT}/${this.result.semester}/${folder}/${folder}.md`;
      if (this.app.vault.getAbstractFileByPath(path)) errors.push(t("duplicateCourse"));
    }
    return errors;
  }

  private validateSchedules(): string[] {
    if (!this.result.schedules.length) return [t("addSchedule")];
    const errors: string[] = [];
    const scheduleRanges: Array<{ day: string; start: number; end: number }> = [];
    this.result.schedules.forEach((schedule, index) => {
      const period = parsePeriod(schedule.period);
      if (!DAYS.includes(schedule.day as (typeof DAYS)[number])) {
        errors.push(`${t("schedule", { index: index + 1 })}: ${t("selectDay")}`);
      }
      if (!period) errors.push(`${t("schedule", { index: index + 1 })}: ${t("periodFormat")}`);
      if (period) {
        const overlaps = scheduleRanges.some(
          (item) =>
            item.day === schedule.day &&
            item.start <= period.end &&
            period.start <= item.end,
        );
        if (overlaps) errors.push(`${t("schedule", { index: index + 1 })}: ${t("overlap")}`);
        scheduleRanges.push({ day: schedule.day, start: period.start, end: period.end });
      }
      if (!schedule.online && !schedule.location?.trim()) errors.push(`${t("schedule", { index: index + 1 })}: ${t("enterLocation")}`);
    });
    return errors;
  }

  private validateAll(): string[] {
    return [...this.validateBasic(), ...this.validateSchedules()];
  }

  private fieldError(key: string): string {
    if (!this.touched.has(key)) return "";
    if (key === "courseName") return this.validateBasic()[0] ?? "";
    const index = Number(key.split("-").at(-1));
    if (key.startsWith("period-") && !parsePeriod(this.result.schedules[index]?.period ?? "")) {
      return t("periodFormat");
    }
    if (key.startsWith("location-") && !this.result.schedules[index]?.online && !this.result.schedules[index]?.location) {
      return t("offlineLocation");
    }
    return "";
  }

  private addErrorSlot(settingEl: HTMLElement, key: string): void {
    settingEl.createDiv({ cls: "sv-field-error", attr: { "data-error-key": key } });
  }

  private updateInlineError(settingEl: HTMLElement, key: string): void {
    const errorEl = settingEl.querySelector(`[data-error-key="${key}"]`) as HTMLElement | null;
    if (!errorEl) return;
    const error = this.fieldError(key);
    errorEl.setText(error);
    errorEl.toggleClass("is-visible", Boolean(error));
  }

  private markStepTouched(step: number): void {
    if (step === 0) this.touched.add("courseName");
    if (step === 1) {
      this.result.schedules.forEach((_, index) => {
        this.touched.add(`period-${index}`);
        this.touched.add(`location-${index}`);
      });
    }
  }

  private addReviewRow(container: HTMLElement, label: string, value: string): void {
    const row = container.createDiv({ cls: "sv-review-row" });
    row.createEl("span", { text: label });
    row.createEl("strong", { text: value });
  }

  private draftSnapshot(): CourseDraft {
    return {
      semester: this.result.semester,
      courseName: this.result.courseName,
      schedules: this.result.schedules.map((schedule) => ({ ...schedule })),
      step: this.step,
    };
  }

  private saveDraft(): Promise<void> {
    const draft = this.draftSnapshot();
    this.draftSaveChain = this.draftSaveChain.then(() => this.onDraft(draft));
    return this.draftSaveChain;
  }

  private scheduleDraftSave(): void {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => {
      this.draftTimer = null;
      void this.saveDraft();
    }, 500);
  }

  private async flushDraft(): Promise<void> {
    if (this.draftTimer !== null) {
      window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      await this.saveDraft();
      return;
    }
    await this.draftSaveChain;
  }

  onClose(): void {
    this.contentEl.empty();
    this.modalEl.removeClass("sv-course-modal-shell");
    if (!this.submitted) {
      if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      void this.saveDraft();
    }
  }
}
