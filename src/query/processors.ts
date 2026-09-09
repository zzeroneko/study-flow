import type { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import { periodToTime } from "../core/constants";
import { queryCourses } from "./courses";
import { loadLectures } from "./lectures";
import { parseCodeblockOptions } from "./tasks";
import { openVaultTask, queryTasks, toggleVaultTask } from "./vaultTasks";
import { loadPersonalStudyNotes } from "./personalStudy";
import { getPluginLanguage, t } from "../core/i18n";

function emptyState(el: HTMLElement, text: string): void {
  el.createEl("p", { text, cls: "sv-query-empty" });
}

function renderTable(el: HTMLElement, headers: string[], rows: string[][]): void {
  if (!rows.length) {
    emptyState(el, t("emptyItems"));
    return;
  }
  const table = el.createEl("table", { cls: "sv-query-table" });
  const thead = table.createEl("thead");
  const headRow = thead.createEl("tr");
  headers.forEach((header) => headRow.createEl("th", { text: header }));
  const tbody = table.createEl("tbody");
  rows.forEach((row) => {
    const tr = tbody.createEl("tr");
    row.forEach((cell) => tr.createEl("td", { text: cell }));
  });
}

function openPath(app: App, path: string): void {
  const file = app.vault.getAbstractFileByPath(path);
  if (file && "extension" in file) {
    void app.workspace.getLeaf(false).openFile(file as TFile);
  }
}

function renderList(el: HTMLElement, app: App, paths: Array<{ path: string; label: string }>): void {
  if (!paths.length) {
    emptyState(el, t("emptyItems"));
    return;
  }
  const list = el.createEl("ul", { cls: "sv-query-list" });
  paths.forEach(({ path, label }) => {
    const item = list.createEl("li");
    const link = item.createEl("a", { text: label, cls: "internal-link", href: path });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openPath(app, path);
    });
  });
}

export function registerQueryProcessors(
  plugin: {
  app: App;
  registerMarkdownCodeBlockProcessor: (
    language: string,
    handler: (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => void | Promise<void>,
  ) => void;
  },
): void {
  const { app } = plugin;

  plugin.registerMarkdownCodeBlockProcessor("univvault-tasks", async (source, el) => {
    el.empty();
    el.addClass("sv-query-block");
    const tasks = await queryTasks(app, source);
    if (!tasks.length) {
      emptyState(el, t("noTaskItems"));
      return;
    }
    const list = el.createEl("ul", { cls: "sv-task-list" });
    for (const task of tasks) {
      const item = list.createEl("li", { cls: "sv-task-item" });
      const checkbox = item.createEl("input", {
        cls: "sv-task-check",
        attr: { type: "checkbox" },
      }) as HTMLInputElement;
      checkbox.checked = task.done;
      checkbox.addEventListener("click", async (event) => {
        event.preventDefault();
        await toggleVaultTask(app, task);
      });
      const body = item.createSpan({ cls: "sv-task-body" });
      body.createSpan({ text: task.text || t("noContent") });
      if (task.due) body.createSpan({ text: ` 📅 ${task.due}`, cls: "sv-task-due" });
      const open = item.createEl("a", {
        text: `${task.file.path}:${task.lineIndex + 1}`,
        cls: "sv-task-source",
        attr: { title: task.file.path },
      });
      open.addEventListener("click", (event) => {
        event.preventDefault();
        void openVaultTask(app, task);
      });
    }
  });

  plugin.registerMarkdownCodeBlockProcessor("univvault-list", (source, el) => {
    el.empty();
    el.addClass("sv-query-block");
    const options = parseCodeblockOptions(source);
    const kind = options.kind || "courses";
    if (kind === "courses") {
      const courses = queryCourses(app, {
        status: options.status || undefined,
        semester: options.semester || undefined,
        folderPrefix: options.folder || undefined,
      });
      renderList(
        el,
        app,
        courses.map((course) => ({
          path: course.path,
          label:
            options.showSemester === "true" ? `${course.semester} · ${course.courseName}` : course.courseName,
        })),
      );
      return;
    }
    if (kind === "personal") {
      renderList(
        el,
        app,
        loadPersonalStudyNotes(app).map((note) => ({ path: note.path, label: note.title })),
      );
      return;
    }
    emptyState(el, t("unknownKind", { type: "list", kind }));
  });

  plugin.registerMarkdownCodeBlockProcessor("univvault-table", (source, el, ctx) => {
    el.empty();
    el.addClass("sv-query-block");
    const options = parseCodeblockOptions(source);
    const kind = options.kind || "lectures";

    if (kind === "lectures") {
      const file = app.vault.getAbstractFileByPath(ctx.sourcePath);
      const folder = file && "parent" in file ? file.parent?.path ?? "" : "";
      const lectures = loadLectures(app, folder);
      renderTable(
        el,
        [t("week"), t("date"), t("type"), t("day"), t("periodLabel")],
        lectures.map((lecture) => [
          lecture.week,
          lecture.date,
          lecture.sessionType,
          lecture.classDay,
          lecture.classPeriod,
        ]),
      );
      return;
    }

    if (kind === "professor-courses") {
      const current = app.metadataCache.getCache(ctx.sourcePath)?.frontmatter ?? {};
      const professorName = String(current.name ?? "");
      const courses = queryCourses(app).filter((course) => {
        const fm = app.metadataCache.getCache(course.path)?.frontmatter ?? {};
        const professors = Array.isArray(fm.professors) ? fm.professors.map(String) : [];
        return professors.some((item) => item.includes(professorName));
      });
      renderTable(
        el,
        [t("semester"), t("course"), t("type"), t("requirement"), t("credits"), t("status")],
        courses.map((course) => {
          const fm = app.metadataCache.getCache(course.path)?.frontmatter ?? {};
          return [
            course.semester,
            course.courseName,
            String(fm.courseField ?? ""),
            String(fm.courseRequirement ?? ""),
            String(fm.credits ?? ""),
            course.status,
          ];
        }),
      );
      return;
    }

    emptyState(el, t("unknownKind", { type: "table", kind }));
  });

  plugin.registerMarkdownCodeBlockProcessor("univvault-info", (_source, el, ctx) => {
    el.empty();
    el.addClass("sv-query-block");
    const current = app.metadataCache.getCache(ctx.sourcePath)?.frontmatter ?? {};
    const fieldMap: Record<string, string> = {
      major: getPluginLanguage() === "ko" ? "전공" : "Major",
      liberal: getPluginLanguage() === "ko" ? "교양" : "Liberal arts",
    };
    const requirementMap: Record<string, string> = {
      required: getPluginLanguage() === "ko" ? "필수" : "Required",
      elective: getPluginLanguage() === "ko" ? "선택" : "Elective",
    };
    const statusMap: Record<string, string> = {
      studying: t("studying"),
      completed: t("completed"),
      paused: t("paused"),
    };
    const field = String(current.courseField ?? "");
    const requirement = String(current.courseRequirement ?? "");
    const rows: string[][] = [
      [t("semester"), String(current.semester ?? "")],
      [t("courseName"), String(current.courseName ?? "")],
      [t("status"), statusMap[String(current.status ?? "")] ?? String(current.status ?? "")],
    ];
    if (field || requirement) {
      rows.splice(2, 0, [t("type"), `${fieldMap[field] ?? field} ${requirementMap[requirement] ?? requirement}`.trim()]);
    }
    if (current.credits !== undefined && current.credits !== "") {
      rows.splice(rows.length - 1, 0, [t("credits"), String(current.credits)]);
    }
    renderTable(el, [t("item"), t("notes")], rows);
  });

  plugin.registerMarkdownCodeBlockProcessor("univvault-schedule", (_source, el, ctx) => {
    el.empty();
    el.addClass("sv-query-block");
    const current = app.metadataCache.getCache(ctx.sourcePath)?.frontmatter ?? {};
    const schedule = Array.isArray(current.schedule) ? current.schedule : [];
    if (!schedule.length) {
      emptyState(el, t("regularSchedule"));
      return;
    }
    renderTable(
      el,
      [t("dayHeader"), t("periodLabel"), t("time"), t("location")],
      schedule.map((item: { day?: string; period?: string; location?: string; online?: boolean }) => [
        String(item.day ?? ""),
        String(item.period ?? ""),
        periodToTime(String(item.period ?? "")),
        item.online ? t("online") : String(item.location ?? ""),
      ]),
    );
  });
}
