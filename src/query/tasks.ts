/** Pure task line parser — no Obsidian imports (testable). */

export interface ParsedTask {
  done: boolean;
  text: string;
  due: string;
  priority: "highest" | "high" | "medium" | "low" | "lowest" | "";
  tags: string[];
  lineIndex: number;
  raw: string;
}

const DUE_RE = /📅\s*(\d{4}-\d{2}-\d{2})/;
const PRIORITY_RE = /(?:⏫|🔼|🔽|⏬|🔺)/;
const TAG_RE = /#([\w가-힣/-]+)/g;

function priorityFromEmoji(raw: string): ParsedTask["priority"] {
  if (raw.includes("🔺") || raw.includes("⏫")) return "highest";
  if (raw.includes("🔼")) return "high";
  if (raw.includes("🔽")) return "low";
  if (raw.includes("⏬")) return "lowest";
  return "";
}

export function parseTaskLine(line: string, lineIndex = 0): ParsedTask | null {
  const match = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (!match) return null;

  const done = match[2].toLowerCase() === "x";
  const body = match[3];
  const dueMatch = body.match(DUE_RE);
  const tags = Array.from(body.matchAll(TAG_RE)).map((item) => item[1]);

  return {
    done,
    text: body
      .replace(DUE_RE, "")
      .replace(PRIORITY_RE, "")
      .replace(TAG_RE, "")
      .replace(/\s+/g, " ")
      .trim(),
    due: dueMatch?.[1] ?? "",
    priority: priorityFromEmoji(body),
    tags,
    lineIndex,
    raw: line,
  };
}

export function parseTasksFromContent(content: string): ParsedTask[] {
  return content
    .split(/\r?\n/)
    .map((line, index) => parseTaskLine(line, index))
    .filter((task): task is ParsedTask => Boolean(task));
}

export interface TaskFilter {
  notDone?: boolean;
  dueOn?: string;
  dueToday?: boolean;
  pathIncludes?: string;
  today?: string;
}

export interface TaskGroups<T extends ParsedTask = ParsedTask> {
  overdue: T[];
  today: T[];
  upcoming: T[];
  undated: T[];
}

export function groupOpenTasks<T extends ParsedTask>(
  tasks: T[],
  today: string,
  upcomingDays = 7,
): TaskGroups<T> {
  const end = addIsoDays(today, upcomingDays);
  const groups: TaskGroups<T> = { overdue: [], today: [], upcoming: [], undated: [] };
  for (const task of tasks) {
    if (task.done) continue;
    if (!task.due) {
      groups.undated.push(task);
    } else if (task.due < today) {
      groups.overdue.push(task);
    } else if (task.due === today) {
      groups.today.push(task);
    } else if (task.due <= end) {
      groups.upcoming.push(task);
    }
  }
  return groups;
}

function addIsoDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + Math.max(0, days));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function filterTasks(tasks: ParsedTask[], filter: TaskFilter): ParsedTask[] {
  return tasks.filter((task) => {
    if (filter.notDone && task.done) return false;
    if (filter.dueToday) {
      const today = filter.today ?? "";
      if (!today || task.due !== today) return false;
    }
    if (filter.dueOn && task.due !== filter.dueOn) return false;
    return true;
  });
}

export function sortTasks(tasks: ParsedTask[]): ParsedTask[] {
  const priorityOrder: Record<string, number> = {
    highest: 0,
    high: 1,
    medium: 2,
    "": 3,
    low: 4,
    lowest: 5,
  };
  return [...tasks].sort((a, b) => {
    const priority = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    if (priority !== 0) return priority;
    return (a.due || "9999").localeCompare(b.due || "9999");
  });
}

export function toggleTaskLine(line: string): string {
  if (/\[[ ]\]/.test(line)) return line.replace("[ ]", "[x]");
  if (/\[[xX]\]/.test(line)) return line.replace(/\[[xX]\]/, "[ ]");
  return line;
}

export function parseCodeblockOptions(source: string): Record<string, string> {
  const options: Record<string, string> = {};
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const sep = line.indexOf(":");
    if (sep === -1) {
      options[line] = "true";
      continue;
    }
    options[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }
  return options;
}
