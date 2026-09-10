import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyScheduleTime,
  parsePeriod,
  periodEndTime,
  periodStartTime,
  periodToTime,
} from "../src/core/dateMath.ts";
import { getDefaultSemesters } from "../src/core/constants.ts";
import {
  filterTasks,
  groupOpenTasks,
  parseCodeblockOptions,
  parseTaskLine,
  parseTasksFromContent,
  sortTasks,
  toggleTaskLine,
} from "../src/query/tasks.ts";
import { escapeYaml, renderTemplate } from "../src/templates/render.ts";
import { renderLectureSections } from "../src/templates/index.ts";
import { migrateHomeContent } from "../src/core/homeMigration.ts";

test("parsePeriod accepts single and range", () => {
  assert.deepEqual(parsePeriod("2"), { start: 2, end: 2, text: "2" });
  assert.deepEqual(parsePeriod("2-4"), { start: 2, end: 4, text: "2-4" });
  assert.equal(parsePeriod("0"), null);
  assert.equal(parsePeriod("4-2"), null);
});

test("period times map to KIT schedule", () => {
  assert.equal(periodToTime("2-4"), "10:10-13:00");
  assert.equal(periodStartTime("2-4"), "10:10");
  assert.equal(periodEndTime("2-4"), "13:00");
});

test("current class includes the 30-minute preparation window", () => {
  assert.deepEqual(classifyScheduleTime("2", 9 * 60 + 45), {
    phase: "current",
    distanceMinutes: 25,
  });
  assert.deepEqual(classifyScheduleTime("2", 9 * 60), {
    phase: "next",
    distanceMinutes: 70,
  });
  assert.deepEqual(classifyScheduleTime("2", 11 * 60 + 10), {
    phase: "past",
    distanceMinutes: 10,
  });
});

test("default semesters follow the requested year", () => {
  assert.deepEqual(getDefaultSemesters(2027), ["2027-1", "2027-2"]);
});

test("task parser reads due date and priority", () => {
  const task = parseTaskLine("- [ ] 보고서 제출 ⏫ 📅 2026-07-10 #priority");
  assert.equal(task?.done, false);
  assert.equal(task?.due, "2026-07-10");
  assert.equal(task?.priority, "highest");
  assert.equal(task?.text.includes("보고서"), true);
  assert.equal(toggleTaskLine("- [ ] hello"), "- [x] hello");
});

test("task filters due today and not done", () => {
  const tasks = parseTasksFromContent(`- [ ] a 📅 2026-07-10
- [x] b 📅 2026-07-10
- [ ] c 📅 2026-07-11`);
  const filtered = filterTasks(tasks, { notDone: true, dueToday: true, today: "2026-07-10" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].text, "a");
  assert.equal(sortTasks(filtered)[0].due, "2026-07-10");
});

test("open tasks are grouped into overdue, today, and upcoming", () => {
  const tasks = parseTasksFromContent(`- [ ] late 📅 2026-07-01
- [ ] today 📅 2026-07-10
- [ ] soon 📅 2026-07-12
- [ ] later 📅 2026-07-20
- [ ] someday`);
  const groups = groupOpenTasks(tasks, "2026-07-10", 7);
  assert.deepEqual(groups.overdue.map((task) => task.text), ["late"]);
  assert.deepEqual(groups.today.map((task) => task.text), ["today"]);
  assert.deepEqual(groups.upcoming.map((task) => task.text), ["soon"]);
  assert.deepEqual(groups.undated.map((task) => task.text), ["someday"]);
});

test("codeblock options parse flags and key values", () => {
  const options = parseCodeblockOptions("not done\ndue on: 2026-07-10\npath includes: 20_University");
  assert.equal(options["not done"], "true");
  assert.equal(options["due on"], "2026-07-10");
  assert.equal(options["path includes"], "20_University");
});

test("built-in templates replace every placeholder safely", () => {
  const rendered = renderTemplate("name: \"{{NAME}}\"\nactive: {{ACTIVE}}", {
    NAME: escapeYaml('김 "교수"'),
    ACTIVE: true,
  });

  test("lecture template omits optional review section without a quick task", () => {
    assert.equal(renderLectureSections(""), "");
    assert.match(renderLectureSections("복습 문제 풀기"), /## 할 일/);
    assert.match(renderLectureSections("복습 문제 풀기"), /\[ \] 복습 문제 풀기/);
  });
  assert.equal(rendered, 'name: "김 \\"교수\\""\nactive: true');
  assert.equal(rendered.includes("{{"), false);
});

test("Home migration is idempotent and preserves custom sections", () => {
  const legacy = `---
type: dashboard
---

# StudyFlow

## 오늘 할 일

\`\`\`univvault-tasks
not done
\`\`\`

## 개인 메모

- 유지할 내용
`;
  const migrated = migrateHomeContent(legacy);
  assert.match(migrated, /```univvault-dashboard/);
  assert.doesNotMatch(migrated, /```univvault-tasks/);
  assert.match(migrated, /유지할 내용/);
  assert.equal(migrateHomeContent(migrated), migrated);
});
