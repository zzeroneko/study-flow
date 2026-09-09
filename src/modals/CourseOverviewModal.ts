import { Modal, Notice, setIcon, Setting, TFile, type App } from "obsidian";
import { DAYS, periodToTime, type CourseInfo } from "../core/constants";
import { loadLectures } from "../query/lectures";
import { loadVaultTasks, openVaultTask, type VaultTask } from "../query/vaultTasks";
import { getPluginLanguage, t } from "../core/i18n";

export class CourseOverviewModal extends Modal {
  constructor(
    app: App,
    private course: CourseInfo,
    private onQuickLecture: () => Promise<void>,
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.modalEl.addClass("sv-course-overview-modal");
    this.titleEl.setText(`${this.course.courseName} · ${t("courseView")}`);
    this.contentEl.empty();
    const body = this.contentEl.createDiv({ cls: "sv-course-overview" });

    const open = body.createEl("button", { text: t("openCourseNote"), cls: "sv-btn sv-btn-ghost" });
    open.addEventListener("click", () => {
      const file = this.app.vault.getAbstractFileByPath(this.course.path);
      if (file instanceof TFile) void this.app.workspace.getLeaf(false).openFile(file);
    });
    const record = body.createEl("button", { text: t("quickLecture"), cls: "sv-btn sv-btn-primary" });
    setIcon(record, "pencil");
    record.addEventListener("click", () => void this.onQuickLecture());

    const metadata = body.createDiv({ cls: "sv-course-overview-meta" });
    metadata.createEl("span", { text: `${t("semester")}: ${this.course.semester}`, cls: "sv-course-semester" });
    new Setting(metadata)
      .setName(t("status"))
      .setDesc(t("statusDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOptions({
          studying: t("studying"),
          completed: t("completed"),
          paused: t("paused"),
        });
        dropdown.setValue(["studying", "completed", "paused"].includes(this.course.status) ? this.course.status : "studying");
        dropdown.onChange(async (value) => {
          const file = this.app.vault.getAbstractFileByPath(this.course.path);
          if (!(file instanceof TFile)) return;
          try {
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
              frontmatter.status = value;
            });
            this.course.status = value;
            new Notice(t("statusChanged", { status: value === "studying" ? t("studying") : value === "completed" ? t("completed") : t("paused") }));
          } catch (error) {
            new Notice(t("statusSaveFailed", { error: (error as Error).message ?? error }));
          }
        });
      });

    const schedule = body.createDiv({ cls: "sv-course-overview-section" });
    schedule.createEl("h3", { text: t("nextSchedule") });
    const next = nextSchedules(this.course);
    if (!next.length) {
      schedule.createEl("p", { text: t("noSchedule"), cls: "sv-query-empty" });
    } else {
      const list = schedule.createDiv({ cls: "sv-course-overview-list" });
      for (const item of next) {
        list.createEl("div", { cls: "sv-course-overview-row" }).createEl("span", {
          text: `${item.date} · ${item.day} · ${t("period", { period: item.period })} · ${periodToTime(item.period)}`,
        });
      }
    }

    const lectures = body.createDiv({ cls: "sv-course-overview-section" });
    lectures.createEl("h3", { text: t("recentLectures") });
    const recent = loadLectures(this.app, this.course.lecturesFolder)
      .sort((a, b) => b.file.stat.mtime - a.file.stat.mtime)
      .slice(0, 5);
    if (!recent.length) {
      lectures.createEl("p", { text: t("noLectures"), cls: "sv-query-empty" });
    } else {
      const list = lectures.createDiv({ cls: "sv-course-overview-list" });
      for (const lecture of recent) {
        const row = list.createEl("button", { cls: "sv-course-overview-row" });
        row.createEl("strong", { text: lecture.file.basename });
        row.createEl("span", { text: [lecture.date, lecture.week && (getPluginLanguage() === "en" ? `Week ${lecture.week}` : `${lecture.week}주차`)].filter(Boolean).join(" · ") });
        row.addEventListener("click", () => void this.app.workspace.getLeaf(false).openFile(lecture.file));
      }
    }

    const tasks = body.createDiv({ cls: "sv-course-overview-section" });
    tasks.createEl("h3", { text: t("remainingTasks") });
    const pending = (await loadVaultTasks(this.app, this.course.folder))
      .filter((task) => !task.done && task.text.trim().length > 0)
      .slice(0, 8);
    renderTasks(tasks, pending, this.app);
  }
}

function renderTasks(container: HTMLElement, tasks: VaultTask[], app: App): void {
  if (!tasks.length) {
    container.createEl("p", { text: t("noRemainingTasks"), cls: "sv-query-empty" });
    return;
  }
  const list = container.createDiv({ cls: "sv-course-overview-list" });
  for (const task of tasks) {
    const row = list.createEl("button", { cls: "sv-course-overview-row" });
    row.createSpan({ text: task.text || (getPluginLanguage() === "en" ? "(No content)" : "(내용 없음)") });
    if (task.due) row.createEl("small", { text: `📅 ${task.due}`, cls: "sv-task-due" });
    row.addEventListener("click", () => void openVaultTask(app, task));
  }
}

function nextSchedules(course: CourseInfo): Array<{ day: string; period: string; date: string }> {
  const now = new Date();
  const today = (now.getDay() + 6) % 7;
  return (course.schedule ?? [])
    .map((schedule) => {
      const day = DAYS.indexOf(schedule.day as (typeof DAYS)[number]);
      if (day < 0) return null;
      const delta = (day - today + 7) % 7;
      const date = new Date(now);
      date.setDate(now.getDate() + delta);
      return {
        day: schedule.day,
        period: schedule.period,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        sort: delta,
      };
    })
    .filter((value): value is { day: string; period: string; date: string; sort: number } => Boolean(value))
    .sort((a, b) => a.sort - b.sort || a.period.localeCompare(b.period))
    .slice(0, 3)
    .map(({ day, period, date }) => ({ day, period, date }));
}
