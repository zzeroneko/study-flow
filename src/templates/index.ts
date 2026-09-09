import { getPluginLanguage, type PluginLanguage } from "../core/i18n.ts";

export const HOME_TEMPLATE = `---
type: dashboard
tags:
  - dashboard
---

# univVault

\`\`\`univvault-dashboard
\`\`\`
`;

export const DAILY_TEMPLATE = `---
type: daily
date: {{DATE}}
created: {{CREATED}}
updated: {{UPDATED}}
tags:
  - daily
---

# {{DATE}}

[[00_Home|Home]]

## 오늘 수업

{{TODAY_CLASSES}}

## 과제

\`\`\`univvault-tasks
not done
due on {{DATE}}
\`\`\`

## 빠른 기록

- 

## 공부

| 과목 / 분야 | 내용 | 시간 |
| --- | --- | --: |
|  |  |  |
`;

export const COURSE_TEMPLATE = `---
type: university
semester: "{{SEMESTER}}"
courseName: "{{COURSE_NAME_YAML}}"
status: studying
created: {{CREATED}}
updated: {{UPDATED}}
schedule: []
tags:
  - university
---

# {{COURSE_NAME}}

[[00_Home|Home]]

## 과목 정보

\`\`\`univvault-info
\`\`\`

## 정규 시간표

\`\`\`univvault-schedule
\`\`\`

## 수업 노트

\`\`\`univvault-table
kind: lectures
\`\`\`

## 과제

\`\`\`univvault-tasks
not done
path includes {{COURSE_FOLDER}}
\`\`\`

## 메모

- 
`;

export const LECTURE_TEMPLATE = `---
type: lecture
title: "{{TITLE}}"
semester: "{{SEMESTER}}"
course: "{{COURSE_LINK_YAML}}"
week: {{WEEK}}
date: {{DATE}}
created: {{CREATED}}
updated: {{UPDATED}}
{{SESSION_TYPE_FIELD}}{{CLASS_DAY_FIELD}}{{CLASS_PERIOD_FIELD}}{{LOCATION_FIELD}}{{ONLINE_FIELD}}
tags:
  - university
  - lecture
---

# {{TITLE}}

[[00_Home|Home]] · {{COURSE_LINK}}

> {{DATE}} · {{WEEK}}주차{{CLASS_INFO}}

## 필기

- 

## 핵심 개념

- 
{{LECTURE_SECTIONS}}
`;

export function renderLectureSections(task = "", language: PluginLanguage = "ko"): string {
  const trimmed = task.trim();
  return trimmed ? `\n\n## ${language === "en" ? "Tasks" : "할 일"}\n\n- [ ] ${trimmed}\n` : "";
}

export interface TemplateSet {
  home: string;
  daily: string;
  course: string;
  lecture: string;
}

export function getTemplateSet(language: PluginLanguage = getPluginLanguage()): TemplateSet {
  if (language === "ko") {
    return { home: HOME_TEMPLATE, daily: DAILY_TEMPLATE, course: COURSE_TEMPLATE, lecture: LECTURE_TEMPLATE };
  }
  return {
    home: HOME_TEMPLATE,
    daily: DAILY_TEMPLATE
      .replace("오늘 수업", "Today's classes")
      .replace("과제", "Tasks")
      .replace("빠른 기록", "Quick notes")
      .replace("공부", "Study")
      .replace("과목 / 분야", "Course / subject")
      .replace("내용", "Notes")
      .replace("시간", "Time")
      .replace("오늘 등록된 수업이 없습니다.", "No classes scheduled today."),
    course: COURSE_TEMPLATE
      .replace("과목 정보", "Course information")
      .replace("정규 시간표", "Regular schedule")
      .replace("수업 노트", "Lecture notes")
      .replace("과제", "Tasks")
      .replace("메모", "Notes"),
    lecture: LECTURE_TEMPLATE
      .replace("주차", "week")
      .replace("필기", "Notes")
      .replace("핵심 개념", "Key concepts")
      .replace("할 일", "Tasks"),
  };
}
