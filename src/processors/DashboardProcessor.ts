import { MarkdownRenderChild, setIcon, TFile, type App, type MarkdownPostProcessorContext } from "obsidian";
import { parsePeriod, periodToTime, todayText } from "../core/constants";
import { loadCourses, todayMatchingSchedules, type TodayMatch } from "../core/vault";
import { loadVaultTasks, openVaultTask, toggleVaultTask } from "../query/vaultTasks";
import { groupOpenTasks, type TaskGroups } from "../query/tasks";
import { loadLectures } from "../query/lectures";
import { t } from "../core/i18n";

export interface DashboardActions {
  daily: () => Promise<void>;
  lecture: () => Promise<void>;
  quickLecture: () => Promise<void>;
  lectureForMatch: (match: TodayMatch) => Promise<void>;
  courseView: () => Promise<void>;
  integrity: () => Promise<void>;
  addCourse: () => Promise<void>;
}

interface DashboardPlugin {
  app: App;
  registerMarkdownCodeBlockProcessor(
    language: string,
    handler: (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => void | Promise<void>,
  ): void;
}

function openFile(app: App, file: TFile): void {
  void app.workspace.getLeaf(false).openFile(file);
}

function createAction(
  container: HTMLElement,
  label: string,
  icon: string,
  action: () => Promise<void>,
  primary = false,
): void {
  const button = container.createEl("button", {
    cls: `sv-dashboard-action${primary ? " is-primary" : ""}`,
  });
  const iconEl = button.createSpan({ cls: "sv-dashboard-action-icon" });
  setIcon(iconEl, icon);
  const text = button.createSpan({ cls: "sv-dashboard-action-text" });
  text.createEl("strong", { text: label });
  button.addEventListener("click", () => {
    void action().catch((error) => console.error("univVault dashboard action failed", error));
  });
}

function createSection(container: HTMLElement, title: string): HTMLElement {
  const section = container.createDiv({ cls: "sv-dashboard-section" });
  section.createEl("h2", { text: title });
  return section;
}

function addMoreButton(container: HTMLElement, hidden: HTMLElement[]): void {
  if (!hidden.length) return;
  const more = container.createEl("button", {
    text: t("more", { count: hidden.length }),
    cls: "sv-dashboard-more",
  });
  more.addEventListener("click", () => {
    const expanded = more.dataset.expanded === "true";
    hidden.forEach((item) => item.toggleClass("is-hidden", expanded));
    more.dataset.expanded = expanded ? "false" : "true";
    more.setText(expanded ? t("more", { count: hidden.length }) : t("less"));
  });
}

async function renderDashboard(
  app: App,
  el: HTMLElement,
  actions: DashboardActions,
): Promise<void> {
    el.empty();
    el.addClass("sv-dashboard");

    const actionsEl = el.createDiv({ cls: "sv-dashboard-actions" });
    createAction(actionsEl, t("todayDaily"), "sun", actions.daily, true);
    createAction(actionsEl, t("lecture"), "book-open", actions.lecture, true);
    createAction(actionsEl, t("quickLecture"), "pencil", actions.quickLecture, true);
    createAction(actionsEl, t("courseView"), "layout-dashboard", actions.courseView);
    createAction(actionsEl, t("addCourse"), "circle-plus", actions.addCourse);
    createAction(actionsEl, t("integrity"), "shield-check", actions.integrity);

    const grid = el.createDiv({ cls: "sv-dashboard-grid" });
    const courses = loadCourses(app, { status: "studying" });
    const matches = todayMatchingSchedules(courses).sort((a, b) => {
      const aStart = parsePeriod(a.schedule.period)?.start ?? Number.MAX_SAFE_INTEGER;
      const bStart = parsePeriod(b.schedule.period)?.start ?? Number.MAX_SAFE_INTEGER;
      return aStart - bStart || a.course.courseName.localeCompare(b.course.courseName, "ko");
    });
    const classesSection = createSection(grid, t("todayClasses"));

    if (!matches.length) {
      classesSection.createEl("p", {
        text: courses.length ? t("noClasses") : t("addCourseFirst"),
        cls: "sv-dashboard-empty",
      });
    } else {
      const list = classesSection.createDiv({ cls: "sv-dashboard-timetable" });
      const hidden: HTMLElement[] = [];
      for (const [index, match] of matches.entries()) {
        const item = list.createEl("button", { cls: "sv-dashboard-timetable-row" });
        if (index >= 6) {
          item.addClass("is-hidden");
          hidden.push(item);
        }
        item.addClass(`is-${match.phase}`);
        const period = item.createDiv({ cls: "sv-dashboard-timetable-period" });
        period.createEl("strong", { text: t("period", { period: match.schedule.period }) });
        period.createEl("small", { text: periodToTime(match.schedule.period) || t("timeUnknown") });
        const course = item.createDiv({ cls: "sv-dashboard-timetable-course" });
        course.createEl("strong", { text: match.course.courseName });
        const lecture = loadLectures(app, match.course.lecturesFolder).find(
          (candidate) =>
            candidate.date === match.date &&
            (!match.schedule.period || candidate.classPeriod === match.schedule.period),
        );
        course.createEl("small", {
          text: [
            match.label.split(" · ")[0],
            match.schedule.online ? t("online") : match.schedule.location || t("locationUnknown"),
            lecture ? `✓ ${t("noteRecorded")}` : t("noteNotRecorded"),
          ].join(" · "),
          cls: lecture ? "is-recorded" : "is-unrecorded",
        });
        const action = item.createSpan({ cls: "sv-dashboard-timetable-action" });
        action.setText(lecture ? t("openNote") : t("record"));
        item.setAttr("aria-label", `${match.label} · ${lecture ? t("openNote") : t("recordNote")}`);
        item.addEventListener("click", () => {
          if (lecture) openFile(app, lecture.file);
          else void actions.lectureForMatch(match);
        });
      }
      addMoreButton(classesSection, hidden);
    }

    const tasksSection = createSection(grid, t("tasks"));
    const tasks = (await loadVaultTasks(app, ["10_Daily/", "20_University/", "30_Personal/"]))
      .filter((task) => task.text.trim().length > 0);
    const groups = groupOpenTasks(tasks, todayText(), 7) as TaskGroups<typeof tasks[number]>;
    const taskGroups: Array<[keyof TaskGroups, string]> = [
      ["overdue", t("overdue")],
      ["today", t("today")],
      ["upcoming", t("upcoming")],
      ["undated", t("undated")],
    ];
    if (!groups.overdue.length && !groups.today.length && !groups.upcoming.length && !groups.undated.length) {
      tasksSection.createEl("p", { text: t("noTasks"), cls: "sv-dashboard-empty" });
    }
    for (const [key, label] of taskGroups) {
      const grouped = groups[key];
      if (!grouped.length) continue;
      const subsection = tasksSection.createDiv({ cls: "sv-dashboard-task-group" });
      subsection.createEl("h3", { text: `${label} (${grouped.length})` });
      const list = subsection.createDiv({ cls: "sv-dashboard-list" });
      const hidden: HTMLElement[] = [];
      for (const [index, task] of grouped.entries()) {
        const row = list.createDiv({ cls: `sv-dashboard-task${key === "overdue" ? " is-overdue" : ""}` });
        if (index >= 4) {
          row.addClass("is-hidden");
          hidden.push(row);
        }
        const checkbox = row.createEl("input", { attr: { type: "checkbox" } }) as HTMLInputElement;
        checkbox.setAttribute("aria-label", `${task.text} ${t("done")}`);
        checkbox.checked = task.done;
        checkbox.addEventListener("change", async () => {
          const requested = checkbox.checked;
          checkbox.disabled = true;
          try {
            const toggled = await toggleVaultTask(app, task);
            if (!toggled) {
              checkbox.checked = !requested;
              return;
            }
            row.classList.toggle("is-done", requested);
          } catch (error) {
            checkbox.checked = !requested;
            console.error("univVault task toggle failed", error);
          } finally {
            checkbox.disabled = false;
          }
        });
        const body = row.createEl("button", { cls: "sv-dashboard-task-body" });
        body.createSpan({ text: task.text });
        const course = courses.find((item) => task.path.startsWith(`${item.folder}/`));
        body.createEl("small", {
          text: [
            course?.courseName ?? t("personal"),
            task.due && `📅 ${task.due}`,
            `${task.file.basename}:${task.lineIndex + 1}`,
          ].filter(Boolean).join(" · "),
        });
        body.addEventListener("click", () => void openVaultTask(app, task));
      }
      addMoreButton(subsection, hidden);
    }

    const coursesSection = createSection(grid, t("studyingCourses"));
    if (!courses.length) {
      const add = coursesSection.createEl("button", { text: t("firstCourse"), cls: "sv-dashboard-more" });
      add.addEventListener("click", () => void actions.addCourse());
      const guideFile = app.vault.getAbstractFileByPath("00_시작하기.md");
      if (guideFile instanceof TFile) {
        const guide = coursesSection.createEl("button", { text: t("gettingStarted"), cls: "sv-dashboard-more" });
        guide.addEventListener("click", () => openFile(app, guideFile));
      }
    } else {
      const chips = coursesSection.createDiv({ cls: "sv-dashboard-courses" });
      const hidden: HTMLElement[] = [];
      for (const [index, course] of courses.entries()) {
        const file = app.vault.getAbstractFileByPath(course.path);
        const button = chips.createEl("button", { text: `${course.semester} · ${course.courseName}`, cls: "sv-dashboard-course" });
        if (index >= 8) {
          button.addClass("is-hidden");
          hidden.push(button);
        }
        if (file && "extension" in file) {
          button.addEventListener("click", () => openFile(app, file as TFile));
        }
      }
      addMoreButton(coursesSection, hidden);
    }
}

class DashboardRefreshChild extends MarkdownRenderChild {
  private timer: number | null = null;

  constructor(
    containerEl: HTMLElement,
    private app: App,
    private refresh: () => Promise<void>,
  ) {
    super(containerEl);
  }

  onload(): void {
    const schedule = (path: string): void => {
      if (!path.startsWith("10_Daily/") && !path.startsWith("20_University/") && !path.startsWith("30_Personal/")) return;
      if (this.timer !== null) window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        this.timer = null;
        void this.refresh();
      }, 100);
    };
    this.registerEvent(this.app.metadataCache.on("changed", (file) => schedule(file.path)));
    this.registerEvent(this.app.vault.on("modify", (file) => schedule(file.path)));
    this.registerEvent(this.app.vault.on("delete", (file) => schedule(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      schedule(file.path);
      schedule(oldPath);
    }));
  }

  onunload(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
  }
}

export function registerDashboardProcessor(
  plugin: DashboardPlugin,
  actions: DashboardActions,
): void {
  plugin.registerMarkdownCodeBlockProcessor("univvault-dashboard", async (_source, el, ctx) => {
    let rendering = false;
    let refreshQueued = false;
    const refresh = async (): Promise<void> => {
      if (rendering) {
        refreshQueued = true;
        return;
      }
      rendering = true;
      try {
        await renderDashboard(plugin.app, el, actions);
      } finally {
        rendering = false;
        if (refreshQueued) {
          refreshQueued = false;
          void refresh();
        }
      }
    };
    ctx.addChild(new DashboardRefreshChild(el, plugin.app, refresh));
    await refresh();
  });
}
