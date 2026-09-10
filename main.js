var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => UnivVaultPlugin
});
module.exports = __toCommonJS(main_exports);
var obsidian = __toESM(require("obsidian"), 1);
var import_obsidian10 = require("obsidian");

// src/core/dateMath.ts
var PERIOD_START = {
  1: "09:10",
  2: "10:10",
  3: "11:10",
  4: "12:10",
  5: "13:10",
  6: "14:10",
  7: "15:10",
  8: "16:10",
  9: "17:10",
  10: "18:10",
  11: "19:10",
  12: "20:10"
};
var PERIOD_END = {
  1: "10:00",
  2: "11:00",
  3: "12:00",
  4: "13:00",
  5: "14:00",
  6: "15:00",
  7: "16:00",
  8: "17:00",
  9: "18:00",
  10: "19:00",
  11: "20:00",
  12: "21:00"
};
var JS_DAY_TO_KR = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
function pad2(value) {
  return String(value).padStart(2, "0");
}
function classifyScheduleTime(periodText, nowMinutes) {
  const normalizedPeriod = String(periodText ?? "");
  const startText = periodStartTime(normalizedPeriod);
  const endText = periodEndTime(normalizedPeriod);
  const toMinutes = (text) => {
    const [hours, minutes] = text.split(":").map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : -1;
  };
  const startMinutes = toMinutes(startText);
  const endMinutes = toMinutes(endText);
  if (startMinutes < 0 || endMinutes < 0) {
    return { phase: "unknown", distanceMinutes: Number.MAX_SAFE_INTEGER };
  }
  if (nowMinutes >= startMinutes - 30 && nowMinutes <= endMinutes) {
    return { phase: "current", distanceMinutes: Math.abs(nowMinutes - startMinutes) };
  }
  if (startMinutes > nowMinutes) {
    return { phase: "next", distanceMinutes: startMinutes - nowMinutes };
  }
  return { phase: "past", distanceMinutes: nowMinutes - endMinutes };
}
function parsePeriod(periodText) {
  const normalized = String(periodText ?? "").replace(/\s+/g, "").replace(/[~–—]/g, "-");
  const match = normalized.match(/^(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 1 || end < 1 || start > 12 || end > 12) return null;
  if (start > end) return null;
  return {
    start,
    end,
    text: start === end ? String(start) : `${start}-${end}`
  };
}
function periodToTime(periodText) {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return `${PERIOD_START[parsed.start]}-${PERIOD_END[parsed.end]}`;
}
function periodStartTime(periodText) {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return PERIOD_START[parsed.start] ?? "";
}
function periodEndTime(periodText) {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return PERIOD_END[parsed.end] ?? "";
}

// src/core/i18n.ts
var translations = {
  ko: {
    language: "\uC5B8\uC5B4",
    languageDesc: "\uD50C\uB7EC\uADF8\uC778 \uD654\uBA74\uACFC \uBA85\uB839\uC5B4\uC5D0 \uC0AC\uC6A9\uD560 \uC5B8\uC5B4\uC785\uB2C8\uB2E4.",
    korean: "\uD55C\uAD6D\uC5B4",
    english: "English",
    supportTitle: "\uD6C4\uC6D0 \uB9C1\uD06C (GitHub Sponsors)",
    supportDesc: "\uD50C\uB7EC\uADF8\uC778 \uAC1C\uBC1C\uC744 \uD6C4\uC6D0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    open: "\uC5F4\uAE30",
    daily: "Daily",
    lecture: "\uC218\uC5C5 \uB178\uD2B8",
    quickLecture: "\uBE60\uB978 \uAC15\uC758 \uAE30\uB85D",
    courseView: "\uACFC\uBAA9 \uD1B5\uD569 \uBCF4\uAE30",
    integrity: "\uB370\uC774\uD130 \uBB34\uACB0\uC131 \uAC80\uC0AC",
    addCourse: "\uACFC\uBAA9 \uCD94\uAC00",
    todayDaily: "\uC624\uB298 Daily",
    more: "\uB354 \uBCF4\uAE30 ({count})",
    less: "\uAC04\uB7B5\uD788 \uBCF4\uAE30",
    todayClasses: "\uC624\uB298 \uC218\uC5C5",
    noClasses: "\uC624\uB298 \uB4F1\uB85D\uB41C \uC218\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    addCourseFirst: "\uBA3C\uC800 \uACFC\uBAA9\uC744 \uCD94\uAC00\uD558\uC138\uC694.",
    period: "{period}\uAD50\uC2DC",
    timeUnknown: "\uC2DC\uAC04 \uBBF8\uC815",
    online: "\uC628\uB77C\uC778",
    locationUnknown: "\uC7A5\uC18C \uBBF8\uC815",
    noteRecorded: "\uB178\uD2B8 \uAE30\uB85D\uB428",
    noteNotRecorded: "\uB178\uD2B8 \uBBF8\uAE30\uB85D",
    openNote: "\uB178\uD2B8 \uC5F4\uAE30",
    record: "\uAE30\uB85D",
    recordNote: "\uB178\uD2B8 \uAE30\uB85D",
    tasks: "\uACFC\uC81C",
    overdue: "\uAE30\uD55C \uC9C0\uB0A8",
    today: "\uC624\uB298",
    now: "\uC9C0\uAE08",
    nextClass: "\uB2E4\uC74C",
    pastClass: "\uC9C0\uB09C \uC218\uC5C5",
    upcoming: "7\uC77C \uB0B4 \uC608\uC815",
    undated: "\uAE30\uD55C \uC5C6\uC74C",
    noTasks: "\uACFC\uC81C \uC5C6\uC74C",
    personal: "\uAC1C\uC778",
    done: "\uC644\uB8CC",
    studyingCourses: "\uC218\uAC15 \uC911 \uACFC\uBAA9",
    firstCourse: "\uCCAB \uACFC\uBAA9 \uCD94\uAC00",
    gettingStarted: "\uC2DC\uC791 \uC548\uB0B4 \uBCF4\uAE30",
    invalidCourseName: "\uACFC\uBAA9\uBA85\uC73C\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uBB38\uC790\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    unusableCourseName: "\uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB294 \uACFC\uBAA9\uBA85\uC785\uB2C8\uB2E4.",
    courseAlreadyOpened: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uACFC\uBAA9\uC744 \uC5F4\uC5C8\uC2B5\uB2C8\uB2E4.",
    courseCreated: "\uACFC\uBAA9 \uCD94\uAC00 \uC644\uB8CC: {name}",
    courseCreateError: "\uACFC\uBAA9 \uCD94\uAC00 \uC911 \uC624\uB958: {error}",
    dailyOpened: "\uC624\uB298 Daily: {date}",
    dailyCreated: "Daily \uC0DD\uC131: {date}",
    lectureFileNameError: "\uC218\uC5C5 \uB178\uD2B8 \uD30C\uC77C\uBA85\uC744 \uB9CC\uB4E4 \uC218 \uC5C6\uB294 \uC77C\uC815\uC785\uB2C8\uB2E4.",
    lectureExists: "\uC774\uBBF8 \uC218\uC5C5 \uB178\uD2B8\uAC00 \uC788\uC2B5\uB2C8\uB2E4: {file}",
    lectureCreated: "\uC218\uC5C5 \uB178\uD2B8 \uC0DD\uC131: {file}",
    noCourses: "\uB4F1\uB85D\uB41C \uACFC\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uACFC\uBAA9\uC744 \uCD94\uAC00\uD558\uC138\uC694.",
    noCoursesCommand: "\uB4F1\uB85D\uB41C \uACFC\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \u300C\uACFC\uBAA9 \uCD94\uAC00\u300D\uB97C \uC2E4\uD589\uD558\uC138\uC694.",
    generatedCourseMissing: "\uC0DD\uC131\uB41C \uACFC\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    chooseTodayClass: "\uC624\uB298 \uC218\uC5C5 \uC120\uD0DD",
    chooseCourse: "\uACFC\uBAA9 \uC120\uD0DD",
    chooseCourseView: "\uD1B5\uD569 \uBCF4\uAE30\uB97C \uC5F4 \uACFC\uBAA9 \uC120\uD0DD",
    taskToggleFailed: "\uC791\uC5C5 \uD56D\uBAA9\uC774 \uBCC0\uACBD\uB418\uC5B4 \uD1A0\uAE00\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC0C8\uB85C\uACE0\uCE68\uD558\uC138\uC694.",
    quickTitle: "\uBE60\uB978 \uAC15\uC758 \uAE30\uB85D",
    quickDesc: "{course} \xB7 \uC81C\uBAA9\uACFC \uD575\uC2EC \uB0B4\uC6A9\uB9CC \uBE60\uB974\uAC8C \uB0A8\uAE41\uB2C8\uB2E4.",
    title: "\uC81C\uBAA9",
    lectureTitleDesc: "\uC218\uC5C5 \uB178\uD2B8\uC758 \uC81C\uBAA9",
    titlePlaceholder: "\uC608: \uC7AC\uADC0\uC640 \uB3D9\uC801 \uACC4\uD68D\uBC95",
    content: "\uB0B4\uC6A9",
    contentDesc: "\uD544\uAE30, \uD575\uC2EC \uAC1C\uB150, \uB9C1\uD06C \uB4F1\uC744 \uC790\uC720\uB86D\uAC8C \uC785\uB825",
    contentPlaceholder: "\uC624\uB298 \uBC30\uC6B4 \uB0B4\uC6A9\uC744 \uC9E7\uAC8C \uAE30\uB85D\uD558\uC138\uC694.",
    optionalTask: "\uD560 \uC77C (\uC120\uD0DD)",
    taskDesc: "\uC785\uB825\uD558\uBA74 \uB178\uD2B8\uC5D0 \uBBF8\uC644\uB8CC task\uB85C \uCD94\uAC00\uB429\uB2C8\uB2E4.",
    taskPlaceholder: "\uC608: 3\uC7A5 \uC5F0\uC2B5\uBB38\uC81C \uD480\uAE30",
    cancel: "\uCDE8\uC18C",
    saveRecord: "\uAE30\uB85D \uC800\uC7A5",
    addCourseDescMobile: "\uACFC\uBAA9\uBA85\uACFC \uC2DC\uAC04\uD45C\uB9CC \uC785\uB825\uD558\uBA74 \uB429\uB2C8\uB2E4.",
    addCourseDesc: "\uD559\uAE30\xB7\uACFC\uBAA9\uBA85\xB7\uC2DC\uAC04\uD45C\uB97C \uD655\uC778\uD558\uACE0 \uBC14\uB85C \uC0DD\uC131\uD569\uB2C8\uB2E4.",
    autosaved: "\uC790\uB3D9 \uC800\uC7A5\uB428",
    subject: "\uACFC\uBAA9",
    timetable: "\uC2DC\uAC04\uD45C",
    review: "\uD655\uC778",
    semester: "\uD559\uAE30",
    courseName: "\uACFC\uBAA9\uBA85",
    courseNamePlaceholder: "\uC608: \uC6F9\uAE30\uCD08",
    add: "+ \uCD94\uAC00",
    addSchedule: "\uC2DC\uAC04\uD45C\uB97C \uD558\uB098 \uC774\uC0C1 \uCD94\uAC00\uD558\uC138\uC694.",
    schedule: "\uC2DC\uAC04\uD45C {index}",
    remove: "\uC0AD\uC81C",
    day: "\uC694\uC77C",
    periodLabel: "\uAD50\uC2DC",
    periodPlaceholder: "2 \uB610\uB294 2-4",
    periodHint: "\uAD50\uC2DC \uC785\uB825 \uC2DC \uC2E4\uC81C \uC2DC\uAC04\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    onlineLabel: "\uC628\uB77C\uC778",
    location: "\uC7A5\uC18C",
    locationPlaceholder: "\uC608: D502",
    notEntered: "\uBBF8\uC785\uB825",
    countSchedules: "\uC2DC\uAC04\uD45C {count}\uAC1C",
    generatedLocation: "\uC0DD\uC131 \uC704\uCE58: {path}",
    reset: "\uCD08\uAE30\uD654",
    close: "\uB2EB\uAE30",
    previous: "\uC774\uC804",
    next: "\uB2E4\uC74C",
    createCourse: "\uACFC\uBAA9 \uC0DD\uC131",
    selectSemester: "\uD559\uAE30\uB97C \uC120\uD0DD\uD558\uC138\uC694.",
    semesterFormat: "\uD559\uAE30\uB294 YYYY-1 \uB610\uB294 YYYY-2 \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
    enterCourseName: "\uACFC\uBAA9\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694.",
    validCourseName: "\uACFC\uBAA9\uBA85\uC5D0 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uBB38\uC790\uB97C \uC785\uB825\uD558\uC138\uC694.",
    duplicateCourse: "\uAC19\uC740 \uD559\uAE30\uC5D0 \uC774\uBBF8 \uB4F1\uB85D\uB41C \uACFC\uBAA9\uC785\uB2C8\uB2E4.",
    selectDay: "\uC694\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694.",
    periodFormat: "\uAD50\uC2DC\uB294 1 \uB610\uB294 1-4 \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD558\uC138\uC694.",
    overlap: "\uAC19\uC740 \uC694\uC77C\uC758 \uAD50\uC2DC\uAC00 \uACB9\uCE69\uB2C8\uB2E4.",
    enterLocation: "\uC7A5\uC18C\uB97C \uC785\uB825\uD558\uC138\uC694.",
    offlineLocation: "\uC624\uD504\uB77C\uC778 \uC218\uC5C5\uC740 \uC7A5\uC18C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.",
    integrityTitle: "StudyFlow \uB370\uC774\uD130 \uBB34\uACB0\uC131 \uAC80\uC0AC",
    integrityScanning: "\uD30C\uC77C\uACFC \uC0DD\uC131\uB41C \uCC38\uC870\uB97C \uAC80\uC0AC\uD558\uB294 \uC911\uC785\uB2C8\uB2E4\u2026",
    integritySummary: "{files}\uAC1C \uD30C\uC77C \uAC80\uC0AC \xB7 {issues}\uAC1C \uC774\uC288",
    integrityNone: "\uBB38\uC81C\uAC00 \uBC1C\uACAC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
    integrityFirst100: "\uCC98\uC74C 100\uAC1C\uB9CC \uD45C\uC2DC\uD588\uC2B5\uB2C8\uB2E4.",
    rescan: "\uB2E4\uC2DC \uAC80\uC0AC",
    applySafeFixes: "\uC548\uC804\uD55C \uC218\uC815 \uC801\uC6A9 ({count})",
    status: "\uC0C1\uD0DC",
    statusDesc: "\uACFC\uBAA9\uC744 \uB300\uC2DC\uBCF4\uB4DC\uC640 \uBAA9\uB85D\uC5D0\uC11C \uAD6C\uBD84\uD569\uB2C8\uB2E4.",
    studying: "\uC218\uAC15 \uC911",
    completed: "\uC218\uAC15 \uC644\uB8CC",
    paused: "\uBCF4\uB958",
    statusChanged: "\uACFC\uBAA9 \uC0C1\uD0DC\uB97C {status}\uB85C \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4.",
    statusSaveFailed: "\uACFC\uBAA9 \uC0C1\uD0DC\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: {error}",
    openCourseNote: "\uACFC\uBAA9 \uB178\uD2B8 \uC5F4\uAE30",
    nextSchedule: "\uB2E4\uC74C \uC2DC\uAC04\uD45C",
    noSchedule: "\uB4F1\uB85D\uB41C \uC2DC\uAC04\uD45C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    recentLectures: "\uCD5C\uADFC \uAC15\uC758",
    noLectures: "\uC544\uC9C1 \uAE30\uB85D\uB41C \uAC15\uC758\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    remainingTasks: "\uB0A8\uC740 \uACFC\uC81C",
    noRemainingTasks: "\uB0A8\uC740 \uACFC\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    emptyItems: "\uD45C\uC2DC\uD560 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    noTaskItems: "\uD560 \uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    noContent: "(\uB0B4\uC6A9 \uC5C6\uC74C)",
    week: "\uC8FC\uCC28",
    date: "\uB0A0\uC9DC",
    type: "\uAD6C\uBD84",
    course: "\uACFC\uBAA9",
    requirement: "\uC774\uC218",
    credits: "\uD559\uC810",
    item: "\uD56D\uBAA9",
    notes: "\uB0B4\uC6A9",
    regularSchedule: "\uB4F1\uB85D\uB41C \uC815\uADDC \uC2DC\uAC04\uD45C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    dayHeader: "\uC694\uC77C",
    time: "\uC2DC\uAC04",
    unknownKind: "\uC54C \uC218 \uC5C6\uB294 {type} kind: {kind}",
    integrityTimestamp: "managed \uD30C\uC77C\uC5D0 {fields}\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    integrityLocation: "{type} \uD30C\uC77C\uC774 \uAD00\uB9AC \uD3F4\uB354 \uADDC\uCE59 \uBC16\uC5D0 \uC788\uC2B5\uB2C8\uB2E4.",
    integrityMissingType: "\uACFC\uBAA9 \uD3F4\uB354 \uC548\uC5D0 type \uBA54\uD0C0\uB370\uC774\uD130\uAC00 \uC5C6\uB294 \uACFC\uBAA9 \uD6C4\uBCF4\uC785\uB2C8\uB2E4. type: university \uC5EC\uBD80\uB97C \uD655\uC778\uD558\uC138\uC694.",
    integrityCourseMetadata: "courseName/semester/schedule \uBA54\uD0C0\uB370\uC774\uD130\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    integritySemesterMismatch: "\uACFC\uBAA9 \uBA54\uD0C0\uB370\uC774\uD130 \uD559\uAE30({metadata})\uC640 \uD3F4\uB354 \uD559\uAE30({path})\uAC00 \uB2E4\uB985\uB2C8\uB2E4.",
    integrityCourseNameMismatch: "\uACFC\uBAA9 \uD3F4\uB354/\uD30C\uC77C\uBA85({path})\uC774 courseName({name})\uACFC \uB2E4\uB985\uB2C8\uB2E4.",
    integrityEmptyLecture: "\uB0B4\uC6A9\uC774 \uBE44\uC5B4 \uC788\uB294 \uAC15\uC758 \uB178\uD2B8\uC785\uB2C8\uB2E4. \uAE30\uB85D\uD560 \uB0B4\uC6A9\uC744 \uCD94\uAC00\uD560\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
    integrityLectureSemesterMismatch: "\uAC15\uC758 \uB178\uD2B8 \uBA54\uD0C0\uB370\uC774\uD130 \uD559\uAE30({metadata})\uC640 \uACBD\uB85C \uD559\uAE30({path})\uAC00 \uB2E4\uB985\uB2C8\uB2E4.",
    integrityDuplicateCourse: "\uAC19\uC740 \uD559\uAE30/\uACFC\uBAA9\uBA85\uC758 \uACFC\uBAA9 \uD30C\uC77C\uC774 {count}\uAC1C\uC785\uB2C8\uB2E4. \uC0AD\uC81C\uD558\uC9C0 \uC54A\uACE0 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    integrityEmptyCourse: "\uACFC\uBAA9\uC758 \uD559\uAE30 \uB610\uB294 \uACFC\uBAA9\uBA85\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
    integrityDuplicateLecture: "\uAC19\uC740 \uACFC\uBAA9/\uC8FC\uCC28/\uB0A0\uC9DC\uC758 \uAC15\uC758 \uB178\uD2B8\uAC00 {count}\uAC1C\uC785\uB2C8\uB2E4. \uC0AD\uC81C\uD558\uC9C0 \uC54A\uACE0 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    integrityMissingReference: "\uC0DD\uC131\uB41C \uB9C1\uD06C \uB300\uC0C1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4: {target}"
  },
  en: {
    language: "Language",
    languageDesc: "Language used for plugin screens and commands.",
    korean: "\uD55C\uAD6D\uC5B4",
    english: "English",
    supportTitle: "Support link (GitHub Sponsors)",
    supportDesc: "Support the development of this plugin.",
    open: "Open",
    daily: "Daily",
    lecture: "Lecture note",
    quickLecture: "Quick lecture note",
    courseView: "Course overview",
    integrity: "Check data integrity",
    addCourse: "Add course",
    todayDaily: "Today's Daily",
    more: "Show more ({count})",
    less: "Show less",
    todayClasses: "Today's classes",
    noClasses: "No classes scheduled today.",
    addCourseFirst: "Add a course to get started.",
    period: "Period {period}",
    timeUnknown: "Time unknown",
    online: "Online",
    locationUnknown: "Location unknown",
    noteRecorded: "Note recorded",
    noteNotRecorded: "No note yet",
    openNote: "Open note",
    record: "Record",
    recordNote: "Record note",
    tasks: "Tasks",
    overdue: "Overdue",
    today: "Today",
    now: "Now",
    nextClass: "Next",
    pastClass: "Past class",
    upcoming: "Next 7 days",
    undated: "No due date",
    noTasks: "No tasks",
    personal: "Personal",
    done: "Done",
    studyingCourses: "Current courses",
    firstCourse: "Add your first course",
    gettingStarted: "View getting started",
    invalidCourseName: "The course name has no usable characters.",
    unusableCourseName: "This course name cannot be used.",
    courseAlreadyOpened: "This course was already registered and has been opened.",
    courseCreated: "Course added: {name}",
    courseCreateError: "Could not add the course: {error}",
    dailyOpened: "Today's Daily: {date}",
    dailyCreated: "Daily created: {date}",
    lectureFileNameError: "This schedule cannot be used to create a lecture note filename.",
    lectureExists: "A lecture note already exists: {file}",
    lectureCreated: "Lecture note created: {file}",
    noCourses: "No courses are registered. Add a course first.",
    noCoursesCommand: "No courses are registered. Run \u201CAdd course\u201D first.",
    generatedCourseMissing: "The generated course could not be found.",
    chooseTodayClass: "Choose today's class",
    chooseCourse: "Choose a course",
    chooseCourseView: "Choose a course to open its overview",
    taskToggleFailed: "The task changed and could not be toggled. Refresh the dashboard.",
    quickTitle: "Quick lecture note",
    quickDesc: "{course} \xB7 Quickly capture a title and key points.",
    title: "Title",
    lectureTitleDesc: "Title of the lecture note",
    titlePlaceholder: "e.g. Recursion and dynamic programming",
    content: "Content",
    contentDesc: "Add notes, key concepts, links, and more",
    contentPlaceholder: "Briefly record what you learned today.",
    optionalTask: "Task (optional)",
    taskDesc: "Adds an unchecked task to the note when provided.",
    taskPlaceholder: "e.g. Complete chapter 3 exercises",
    cancel: "Cancel",
    saveRecord: "Save note",
    addCourseDescMobile: "Enter a course name and schedule.",
    addCourseDesc: "Review the semester, course name, and schedule before creating it.",
    autosaved: "Saved automatically",
    subject: "Course",
    timetable: "Schedule",
    review: "Review",
    semester: "Semester",
    courseName: "Course name",
    courseNamePlaceholder: "e.g. Web fundamentals",
    add: "+ Add",
    addSchedule: "Add at least one schedule.",
    schedule: "Schedule {index}",
    remove: "Remove",
    day: "Day",
    periodLabel: "Period",
    periodPlaceholder: "2 or 2-4",
    periodHint: "The actual time appears when a period is entered.",
    onlineLabel: "Online",
    location: "Location",
    locationPlaceholder: "e.g. D502",
    notEntered: "Not entered",
    countSchedules: "{count} schedule(s)",
    generatedLocation: "Location: {path}",
    reset: "Reset",
    close: "Close",
    previous: "Back",
    next: "Next",
    createCourse: "Create course",
    selectSemester: "Select a semester.",
    semesterFormat: "Semester must use the YYYY-1 or YYYY-2 format.",
    enterCourseName: "Enter a course name.",
    validCourseName: "Enter characters that can be used in a course name.",
    duplicateCourse: "A course is already registered for this semester.",
    selectDay: "Select a day.",
    periodFormat: "Period must use the 1 or 1-4 format.",
    overlap: "Periods overlap on the same day.",
    enterLocation: "Enter a location.",
    offlineLocation: "An in-person class needs a location.",
    integrityTitle: "StudyFlow data integrity check",
    integrityScanning: "Checking files and generated references\u2026",
    integritySummary: "Checked {files} files \xB7 {issues} issues",
    integrityNone: "No problems found.",
    integrityFirst100: "Showing the first 100 issues.",
    rescan: "Scan again",
    applySafeFixes: "Apply safe fixes ({count})",
    status: "Status",
    statusDesc: "Distinguishes this course in the dashboard and lists.",
    studying: "Current",
    completed: "Completed",
    paused: "Paused",
    statusChanged: "Course status changed to {status}.",
    statusSaveFailed: "Could not save the course status: {error}",
    openCourseNote: "Open course note",
    nextSchedule: "Next schedule",
    noSchedule: "No schedule registered.",
    recentLectures: "Recent lectures",
    noLectures: "No lectures recorded yet.",
    remainingTasks: "Remaining tasks",
    noRemainingTasks: "No remaining tasks.",
    emptyItems: "Nothing to display.",
    noTaskItems: "No tasks.",
    noContent: "(No content)",
    week: "Week",
    date: "Date",
    type: "Type",
    course: "Course",
    requirement: "Requirement",
    credits: "Credits",
    item: "Item",
    notes: "Notes",
    regularSchedule: "No regular schedule registered.",
    dayHeader: "Day",
    time: "Time",
    unknownKind: "Unknown {type} kind: {kind}",
    integrityTimestamp: "Managed file is missing {fields}.",
    integrityLocation: "{type} file is outside its managed folder.",
    integrityMissingType: "Possible course file without type metadata. Check for type: university.",
    integrityCourseMetadata: "courseName/semester/schedule metadata is invalid.",
    integritySemesterMismatch: "Course semester metadata ({metadata}) differs from folder semester ({path}).",
    integrityCourseNameMismatch: "Course folder/file ({path}) differs from courseName ({name}).",
    integrityEmptyLecture: "This lecture note is empty. Consider adding content.",
    integrityLectureSemesterMismatch: "Lecture semester metadata ({metadata}) differs from path semester ({path}).",
    integrityDuplicateCourse: "There are {count} course files with the same semester and name. Review without deleting.",
    integrityEmptyCourse: "The course semester or name is empty.",
    integrityDuplicateLecture: "There are {count} lecture notes for the same course/week/date. Review without deleting.",
    integrityMissingReference: "Generated link target does not exist: {target}"
  }
};
var currentLanguage = "en";
function getDefaultLanguage(obsidianLanguage = "en") {
  return obsidianLanguage.toLowerCase().startsWith("ko") ? "ko" : "en";
}
function setLanguage(language) {
  currentLanguage = language === "en" ? "en" : "ko";
}
function getPluginLanguage() {
  return currentLanguage;
}
function t(key, variables = {}) {
  const template = translations[currentLanguage][key] ?? translations.ko[key];
  return template.replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? `{${name}}`));
}
function dayLabel(day) {
  if (currentLanguage === "ko") return day;
  return { \uC6D4: "Mon", \uD654: "Tue", \uC218: "Wed", \uBAA9: "Thu", \uAE08: "Fri", \uD1A0: "Sat", \uC77C: "Sun" }[day] ?? day;
}

// src/core/constants.ts
var UNIVERSITY_ROOT = "20_University";
var DAILY_FOLDER = "10_Daily";
var PERSONAL_STUDY_ROOT = "30_Personal";
var DAYS = ["\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0", "\uC77C"];
function getDefaultSemesters(year = (/* @__PURE__ */ new Date()).getFullYear()) {
  return [`${year}-1`, `${year}-2`];
}
function normalizePath(path) {
  return String(path ?? "").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}
function sanitizeFileName(name) {
  return String(name ?? "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
}
function escapeYamlString(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function todayText() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function todayKoreanDay() {
  return JS_DAY_TO_KR[(/* @__PURE__ */ new Date()).getDay()];
}
function makeWikiLink(path, alias) {
  const withoutExtension = String(path).replace(/\.md$/, "");
  return `[[${withoutExtension}|${alias}]]`;
}
function makeScheduleId(day, periodText) {
  const parsed = parsePeriod(periodText);
  const period = parsed ? parsed.text : String(periodText ?? "").replace(/\s+/g, "");
  return `${day}${period}`;
}
function semesterIndexPath(semester) {
  return `${UNIVERSITY_ROOT}/${semester}/00_${semester}${getPluginLanguage() === "ko" ? " \uD559\uAE30" : " Semester"}.md`;
}

// src/core/vault.ts
var import_obsidian = require("obsidian");

// src/templates/render.ts
function renderTemplate(template, values) {
  return Object.entries(values).reduce(
    (content, [key, value]) => content.split(`{{${key}}}`).join(String(value)),
    template
  );
}
function currentTimestamp(date = /* @__PURE__ */ new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
function managedTimestampValues(date = /* @__PURE__ */ new Date()) {
  const timestamp = currentTimestamp(date);
  return { CREATED: timestamp, UPDATED: timestamp };
}

// src/core/vaultIndex.ts
var indexes = /* @__PURE__ */ new WeakMap();
function getIndex(app) {
  const existing = indexes.get(app);
  if (existing) return existing;
  const index = { markdownFiles: null, taskContent: /* @__PURE__ */ new Map() };
  indexes.set(app, index);
  return index;
}
function getMarkdownFiles(app) {
  const index = getIndex(app);
  if (!index.markdownFiles) index.markdownFiles = app.vault.getMarkdownFiles();
  return index.markdownFiles;
}
async function getCachedFileContent(app, file) {
  const index = getIndex(app);
  const cached = index.taskContent.get(file.path);
  if (cached && cached.mtime === file.stat.mtime && cached.size === file.stat.size) {
    return cached.content;
  }
  const content = await app.vault.cachedRead(file);
  index.taskContent.set(file.path, { mtime: file.stat.mtime, size: file.stat.size, content });
  return content;
}
function invalidateVaultIndex(app, path) {
  const index = getIndex(app);
  index.markdownFiles = null;
  if (path) index.taskContent.delete(path);
  else index.taskContent.clear();
}

// src/core/vault.ts
function notice(message) {
  new import_obsidian.Notice(message);
}
var MANAGED_TYPES = /* @__PURE__ */ new Set(["daily", "university", "lecture", "single"]);
var folderLocks = /* @__PURE__ */ new Map();
var fileCreationLocks = /* @__PURE__ */ new Map();
var timestampUpdates = /* @__PURE__ */ new Set();
async function updateManagedFileTimestamp(app, file) {
  if (file.extension !== "md") return;
  if (timestampUpdates.has(file.path)) return;
  const content = await app.vault.cachedRead(file);
  const frontmatter2 = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter2) return;
  const type = frontmatter2[1].match(/^type:\s*(\S+)\s*$/m)?.[1];
  const body = frontmatter2[1];
  const createdMatch = body.match(/^created:\s*(.*)\s*$/m);
  const updatedMatch = body.match(/^updated:\s*(.*)\s*$/m);
  const created = createdMatch?.[1]?.trim() ? createdMatch : null;
  const updated = updatedMatch?.[1]?.trim() ? updatedMatch : null;
  if ((!type || !MANAGED_TYPES.has(type)) && !created && !updated) return;
  const timestamp = currentTimestamp();
  let next = body;
  if (!created) {
    const createdAt = currentTimestamp(new Date(file.stat.ctime));
    next = createdMatch ? next.replace(/^created:\s*.*$/m, `created: ${createdAt}`) : `${next.trimEnd()}
created: ${createdAt}
`;
  }
  if (created?.[1] && updated?.[1]?.trim() === timestamp) return;
  if (updatedMatch) {
    next = next.replace(/^updated:\s*.*$/m, `updated: ${timestamp}`);
  } else {
    next = `${next.trimEnd()}
updated: ${timestamp}
`;
  }
  const nextContent = content.replace(frontmatter2[1], next);
  if (nextContent !== content) {
    timestampUpdates.add(file.path);
    try {
      await app.vault.modify(file, nextContent);
    } finally {
      timestampUpdates.delete(file.path);
    }
  }
}
async function exists(app, path) {
  return await app.vault.adapter.exists(normalizePath(path));
}
async function ensureFolder(app, path) {
  const normalized = normalizePath(path);
  if (!normalized) return;
  const previous = folderLocks.get(normalized);
  if (previous) {
    await previous;
    return;
  }
  const operation = (async () => {
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await exists(app, current)) {
        await app.vault.createFolder(current);
      }
    }
  })();
  folderLocks.set(normalized, operation);
  try {
    await operation;
  } finally {
    if (folderLocks.get(normalized) === operation) folderLocks.delete(normalized);
  }
}
async function createFileIfMissing(app, path, content) {
  const normalized = normalizePath(path);
  const previous = fileCreationLocks.get(normalized);
  if (previous) {
    await previous;
    return null;
  }
  const operation = (async () => {
    if (await exists(app, normalized)) return null;
    await ensureFolder(app, normalized.split("/").slice(0, -1).join("/"));
    return await app.vault.create(normalized, content);
  })();
  fileCreationLocks.set(normalized, operation);
  try {
    return await operation;
  } finally {
    if (fileCreationLocks.get(normalized) === operation) fileCreationLocks.delete(normalized);
  }
}
async function openPath(app, path) {
  const file = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(path));
  if (file && "extension" in file) {
    await app.workspace.getLeaf(true).openFile(file);
  }
}
function loadCourse(app, file) {
  const normalizedPath = normalizePath(file.path);
  if (!normalizedPath.startsWith(`${UNIVERSITY_ROOT}/`)) return null;
  if (normalizedPath.includes("/Common/") || normalizedPath.includes("/Exports/")) {
    return null;
  }
  const frontmatter2 = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter2 || frontmatter2.type !== "university") return null;
  const courseName = String(frontmatter2.courseName ?? file.basename ?? "").trim();
  const semester = String(frontmatter2.semester ?? "").trim();
  const status = String(frontmatter2.status ?? "").trim();
  if (!courseName || !semester || courseName.includes("{{") || semester.includes("{{")) return null;
  const folder = file.parent?.path ?? normalizedPath.split("/").slice(0, -1).join("/");
  const schedule = Array.isArray(frontmatter2.schedule) ? frontmatter2.schedule : [];
  return {
    path: file.path,
    folder,
    lecturesFolder: `${folder}/Lectures`,
    courseName,
    semester,
    status,
    schedule
  };
}
function loadCourses(app, options = {}) {
  const { status, semester } = options;
  const courses = getMarkdownFiles(app).map((file) => loadCourse(app, file)).filter((course) => {
    if (!course) return false;
    if (status && course.status !== status) return false;
    if (semester && course.semester !== semester) return false;
    return true;
  }).filter((item) => Boolean(item));
  courses.sort((a, b) => {
    const semesterCompare = String(b.semester).localeCompare(String(a.semester), "ko");
    if (semesterCompare !== 0) return semesterCompare;
    return String(a.courseName).localeCompare(String(b.courseName), "ko");
  });
  return courses;
}
function todayMatchingSchedules(courses) {
  const todayDay = todayKoreanDay();
  const today = todayText();
  const matches = [];
  const now = /* @__PURE__ */ new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const course of courses) {
    for (const schedule of course.schedule ?? []) {
      if (schedule.day !== todayDay) continue;
      const { phase, distanceMinutes } = classifyScheduleTime(schedule.period, nowMinutes);
      const phaseLabel = phase === "current" ? t("now") : phase === "next" ? t("nextClass") : phase === "past" ? t("pastClass") : t("today");
      matches.push({
        course,
        schedule,
        week: 1,
        date: today,
        phase,
        distanceMinutes,
        label: [
          phaseLabel,
          course.courseName,
          schedule.period ? t("period", { period: schedule.period }) : "",
          periodToTime(schedule.period),
          schedule.online ? t("online") : schedule.location || ""
        ].filter(Boolean).join(" \xB7 ")
      });
    }
  }
  const phaseOrder = { current: 0, next: 1, unknown: 2, past: 3 };
  return matches.sort(
    (a, b) => phaseOrder[a.phase] - phaseOrder[b.phase] || a.distanceMinutes - b.distanceMinutes || a.course.courseName.localeCompare(b.course.courseName, "ko")
  );
}
async function appendCourseToSemesterIndex(app, semester, coursePath, courseName) {
  const indexPath = semesterIndexPath(semester);
  const link = makeWikiLink(coursePath, courseName);
  const bullet = `- ${link}`;
  if (!await exists(app, indexPath)) {
    await ensureFolder(app, `${UNIVERSITY_ROOT}/${semester}`);
    const content = `---
type: semester-index
semester: "${escapeYamlString(semester)}"
tags:
  - university
  - semester
---

# ${semester}${getPluginLanguage() === "ko" ? "\uD559\uAE30" : ""}

[[00_Home|Home]]

## ${t("course")}

${bullet}
`;
    await app.vault.create(indexPath, content);
    return;
  }
  const file = app.vault.getAbstractFileByPath(indexPath);
  if (!file || file instanceof import_obsidian.TFolder) return;
  const current = await app.vault.read(file);
  if (current.includes(coursePath.replace(/\.md$/, "")) || current.includes(`|${courseName}]]`)) {
    return;
  }
  const sectionHeading = getPluginLanguage() === "ko" ? "\uACFC\uBAA9" : "Course";
  if (new RegExp(`## ${sectionHeading}\\s*\\n`).test(current)) {
    await app.vault.modify(file, current.replace(new RegExp(`(## ${sectionHeading}\\s*\\n)`), `$1${bullet}
`));
  } else {
    await app.vault.modify(file, `${current.trimEnd()}

## ${t("course")}

${bullet}
`);
  }
}

// src/templates/index.ts
var HOME_TEMPLATE = `---
type: dashboard
tags:
  - dashboard
---

# StudyFlow

\`\`\`univvault-dashboard
\`\`\`
`;
var DAILY_TEMPLATE = `---
type: daily
date: {{DATE}}
created: {{CREATED}}
updated: {{UPDATED}}
tags:
  - daily
---

# {{DATE}}

[[00_Home|Home]]

## \uC624\uB298 \uC218\uC5C5

{{TODAY_CLASSES}}

## \uACFC\uC81C

\`\`\`univvault-tasks
not done
due on {{DATE}}
\`\`\`

## \uBE60\uB978 \uAE30\uB85D

- 

## \uACF5\uBD80

| \uACFC\uBAA9 / \uBD84\uC57C | \uB0B4\uC6A9 | \uC2DC\uAC04 |
| --- | --- | --: |
|  |  |  |
`;
var COURSE_TEMPLATE = `---
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

## \uACFC\uBAA9 \uC815\uBCF4

\`\`\`univvault-info
\`\`\`

## \uC815\uADDC \uC2DC\uAC04\uD45C

\`\`\`univvault-schedule
\`\`\`

## \uC218\uC5C5 \uB178\uD2B8

\`\`\`univvault-table
kind: lectures
\`\`\`

## \uACFC\uC81C

\`\`\`univvault-tasks
not done
path includes {{COURSE_FOLDER}}
\`\`\`

## \uBA54\uBAA8

- 
`;
var LECTURE_TEMPLATE = `---
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

[[00_Home|Home]] \xB7 {{COURSE_LINK}}

> {{DATE}} \xB7 {{WEEK}}\uC8FC\uCC28{{CLASS_INFO}}

## \uD544\uAE30

- 

## \uD575\uC2EC \uAC1C\uB150

- 
{{LECTURE_SECTIONS}}
`;
function renderLectureSections(task = "", language = "ko") {
  const trimmed = task.trim();
  return trimmed ? `

## ${language === "en" ? "Tasks" : "\uD560 \uC77C"}

- [ ] ${trimmed}
` : "";
}
function getTemplateSet(language = getPluginLanguage()) {
  if (language === "ko") {
    return { home: HOME_TEMPLATE, daily: DAILY_TEMPLATE, course: COURSE_TEMPLATE, lecture: LECTURE_TEMPLATE };
  }
  return {
    home: HOME_TEMPLATE,
    daily: DAILY_TEMPLATE.replace("\uC624\uB298 \uC218\uC5C5", "Today's classes").replace("\uACFC\uC81C", "Tasks").replace("\uBE60\uB978 \uAE30\uB85D", "Quick notes").replace("\uACF5\uBD80", "Study").replace("\uACFC\uBAA9 / \uBD84\uC57C", "Course / subject").replace("\uB0B4\uC6A9", "Notes").replace("\uC2DC\uAC04", "Time").replace("\uC624\uB298 \uB4F1\uB85D\uB41C \uC218\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "No classes scheduled today."),
    course: COURSE_TEMPLATE.replace("\uACFC\uBAA9 \uC815\uBCF4", "Course information").replace("\uC815\uADDC \uC2DC\uAC04\uD45C", "Regular schedule").replace("\uC218\uC5C5 \uB178\uD2B8", "Lecture notes").replace("\uACFC\uC81C", "Tasks").replace("\uBA54\uBAA8", "Notes"),
    lecture: LECTURE_TEMPLATE.replace("\uC8FC\uCC28", "week").replace("\uD544\uAE30", "Notes").replace("\uD575\uC2EC \uAC1C\uB150", "Key concepts").replace("\uD560 \uC77C", "Tasks")
  };
}

// src/commands/daily.ts
async function createOrOpenDaily(app) {
  const date = todayText();
  const path = `${DAILY_FOLDER}/${date}.md`;
  if (await exists(app, path)) {
    await openPath(app, path);
    notice(t("dailyOpened", { date }));
    return;
  }
  const courses = loadCourses(app, { status: "studying" });
  const matches = todayMatchingSchedules(courses);
  const todayClasses = matches.length ? matches.map(
    ({ course, schedule }) => `- ${makeWikiLink(course.path, course.courseName)} \xB7 ${t("period", { period: schedule.period })} \xB7 ${periodToTime(schedule.period) || t("timeUnknown")} \xB7 ${schedule.online ? t("online") : schedule.location || t("locationUnknown")}`
  ).join("\n") : `- ${t("noClasses")}`;
  const content = renderTemplate(getTemplateSet().daily, {
    DATE: date,
    date,
    TODAY_CLASSES: todayClasses,
    ...managedTimestampValues()
  });
  const file = await createFileIfMissing(app, path, content);
  if (file) {
    await app.workspace.getLeaf(true).openFile(file);
    notice(t("dailyCreated", { date }));
  } else {
    await openPath(app, path);
  }
}

// src/modals/CourseCreateModal.ts
var import_obsidian2 = require("obsidian");
var CourseCreateModal = class extends import_obsidian2.Modal {
  constructor(app, locations, draft, onDraft, onSubmit) {
    super(app);
    this.locations = locations;
    this.onDraft = onDraft;
    this.onSubmit = onSubmit;
    this.submitted = false;
    this.submitting = false;
    this.touched = /* @__PURE__ */ new Set();
    this.draftTimer = null;
    this.draftSaveChain = Promise.resolve();
    this.result = {
      semester: draft.semester || getDefaultSemesters()[1],
      courseName: draft.courseName,
      schedules: draft.schedules.length ? draft.schedules.map((schedule) => ({ ...schedule })) : [{ day: "\uC6D4", period: "1", location: "", online: false }]
    };
    this.step = Math.min(Math.max(draft.step ?? 0, 0), 2);
  }
  onOpen() {
    this.modalEl.addClass("sv-course-modal-shell");
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("sv-course-modal");
    const header = contentEl.createDiv({ cls: "sv-modal-header" });
    const titleWrap = header.createDiv();
    titleWrap.createEl("h2", { text: t("addCourse") });
    titleWrap.createEl("p", {
      text: import_obsidian2.Platform.isMobile ? t("addCourseDescMobile") : t("addCourseDesc"),
      cls: "sv-modal-desc"
    });
    header.createEl("span", { text: t("autosaved"), cls: "sv-draft-badge" });
    if (import_obsidian2.Platform.isMobile) this.renderStepper(contentEl);
    const body = contentEl.createDiv({
      cls: import_obsidian2.Platform.isMobile ? "sv-wizard-body" : "sv-desktop-grid"
    });
    if (!import_obsidian2.Platform.isMobile || this.step === 0) this.renderBasicPanel(body);
    if (!import_obsidian2.Platform.isMobile || this.step === 1) this.renderSchedulePanel(body);
    if (!import_obsidian2.Platform.isMobile || this.step === 2) this.renderReviewPanel(body);
    this.renderActions(contentEl);
  }
  renderStepper(container) {
    const stepper = container.createDiv({ cls: "sv-stepper" });
    [t("subject"), t("timetable"), t("review")].forEach((label, index) => {
      const item = stepper.createDiv({
        cls: `sv-step ${index === this.step ? "is-active" : ""} ${index < this.step ? "is-done" : ""}`
      });
      item.createEl("span", { text: String(index + 1), cls: "sv-step-number" });
      item.createEl("small", { text: label });
    });
  }
  renderBasicPanel(container) {
    const panel = container.createDiv({ cls: "sv-panel sv-basic-panel" });
    panel.createEl("h3", { text: t("subject") });
    new import_obsidian2.Setting(panel).setName(t("semester")).addDropdown((dropdown) => {
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
    const nameSetting = new import_obsidian2.Setting(panel).setName(t("courseName")).addText((text) => {
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
  renderSchedulePanel(container) {
    const panel = container.createDiv({ cls: "sv-panel sv-schedule-panel" });
    const heading = panel.createDiv({ cls: "sv-panel-heading" });
    heading.createEl("h3", { text: t("timetable") });
    const addButton = heading.createEl("button", { text: t("add"), cls: "sv-small-button" });
    addButton.addEventListener("click", () => {
      const previous = this.result.schedules.at(-1);
      this.result.schedules.push({
        day: previous?.day ?? "\uC6D4",
        period: previous?.period ?? "1",
        location: previous?.location ?? "",
        online: previous?.online ?? false
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
  renderScheduleRow(container, schedule, index) {
    const row = container.createDiv({ cls: "sv-schedule-row" });
    const rowHeader = row.createDiv({ cls: "sv-schedule-row-header" });
    rowHeader.createEl("strong", { text: t("schedule", { index: index + 1 }) });
    const remove = rowHeader.createEl("button", { text: t("remove"), cls: "sv-link-button is-danger" });
    remove.addEventListener("click", () => {
      this.result.schedules.splice(index, 1);
      this.scheduleDraftSave();
      this.render();
    });
    const daySetting = new import_obsidian2.Setting(row).setName(t("day"));
    const dayControl = daySetting.controlEl.createDiv({ cls: "sv-day-chips" });
    DAYS.forEach((day) => {
      const button = dayControl.createEl("button", {
        text: dayLabel(day),
        cls: `sv-day-chip ${schedule.day === day ? "is-selected" : ""}`
      });
      button.addEventListener("click", () => {
        schedule.day = day;
        this.scheduleDraftSave();
        this.render();
      });
    });
    const periodSetting = new import_obsidian2.Setting(row).setName(t("periodLabel")).addText((text) => {
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
    new import_obsidian2.Setting(row).setName(t("onlineLabel")).addToggle((toggle) => {
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
      const locationSetting = new import_obsidian2.Setting(row).setName(t("location")).addText((text) => {
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
  renderReviewPanel(container) {
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
          schedule.online ? t("online") : schedule.location
        ].filter(Boolean).join(" \xB7 ")
      });
    });
    panel.createEl("p", {
      text: t("generatedLocation", { path: `${UNIVERSITY_ROOT}/${this.result.semester}/${sanitizeFileName(this.result.courseName || t("courseName"))}` }),
      cls: "sv-path-preview"
    });
  }
  renderActions(container) {
    const actions = container.createDiv({ cls: "sv-modal-actions" });
    const left = actions.createDiv({ cls: "sv-action-group" });
    const right = actions.createDiv({ cls: "sv-action-group" });
    const reset = left.createEl("button", { text: t("reset"), cls: "sv-btn sv-btn-ghost" });
    reset.addEventListener("click", () => {
      this.result.semester = getDefaultSemesters()[1];
      this.result.courseName = "";
      this.result.schedules = [{ day: "\uC6D4", period: "1", location: "", online: false }];
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
    if (import_obsidian2.Platform.isMobile && this.step > 0) {
      const previous = right.createEl("button", { text: t("previous"), cls: "sv-btn" });
      previous.addEventListener("click", () => {
        this.step -= 1;
        this.scheduleDraftSave();
        this.render();
      });
    }
    if (import_obsidian2.Platform.isMobile && this.step < 2) {
      const next = right.createEl("button", { text: t("next"), cls: "sv-btn sv-btn-primary" });
      next.addEventListener("click", () => {
        const errors = this.step === 0 ? this.validateBasic() : this.validateSchedules();
        if (errors.length) {
          this.markStepTouched(this.step);
          new import_obsidian2.Notice(errors[0]);
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
  async submit() {
    if (this.submitting) return;
    const errors = this.validateAll();
    if (errors.length) {
      this.markStepTouched(0);
      this.markStepTouched(1);
      new import_obsidian2.Notice(errors[0]);
      if (import_obsidian2.Platform.isMobile) {
        this.step = this.validateBasic().length ? 0 : 1;
      }
      this.render();
      return;
    }
    this.result.schedules.forEach((schedule) => {
      schedule.period = parsePeriod(schedule.period).text;
      schedule.id = makeScheduleId(schedule.day, schedule.period);
      schedule.location = schedule.location?.trim() ?? "";
    });
    this.submitting = true;
    await this.flushDraft();
    this.submitted = true;
    this.close();
    this.onSubmit(this.result);
  }
  validateBasic() {
    const errors = [];
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
  validateSchedules() {
    if (!this.result.schedules.length) return [t("addSchedule")];
    const errors = [];
    const scheduleRanges = [];
    this.result.schedules.forEach((schedule, index) => {
      const period = parsePeriod(schedule.period);
      if (!DAYS.includes(schedule.day)) {
        errors.push(`${t("schedule", { index: index + 1 })}: ${t("selectDay")}`);
      }
      if (!period) errors.push(`${t("schedule", { index: index + 1 })}: ${t("periodFormat")}`);
      if (period) {
        const overlaps = scheduleRanges.some(
          (item) => item.day === schedule.day && item.start <= period.end && period.start <= item.end
        );
        if (overlaps) errors.push(`${t("schedule", { index: index + 1 })}: ${t("overlap")}`);
        scheduleRanges.push({ day: schedule.day, start: period.start, end: period.end });
      }
      if (!schedule.online && !schedule.location?.trim()) errors.push(`${t("schedule", { index: index + 1 })}: ${t("enterLocation")}`);
    });
    return errors;
  }
  validateAll() {
    return [...this.validateBasic(), ...this.validateSchedules()];
  }
  fieldError(key) {
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
  addErrorSlot(settingEl, key) {
    settingEl.createDiv({ cls: "sv-field-error", attr: { "data-error-key": key } });
  }
  updateInlineError(settingEl, key) {
    const errorEl = settingEl.querySelector(`[data-error-key="${key}"]`);
    if (!errorEl) return;
    const error = this.fieldError(key);
    errorEl.setText(error);
    errorEl.toggleClass("is-visible", Boolean(error));
  }
  markStepTouched(step) {
    if (step === 0) this.touched.add("courseName");
    if (step === 1) {
      this.result.schedules.forEach((_, index) => {
        this.touched.add(`period-${index}`);
        this.touched.add(`location-${index}`);
      });
    }
  }
  addReviewRow(container, label, value) {
    const row = container.createDiv({ cls: "sv-review-row" });
    row.createEl("span", { text: label });
    row.createEl("strong", { text: value });
  }
  draftSnapshot() {
    return {
      semester: this.result.semester,
      courseName: this.result.courseName,
      schedules: this.result.schedules.map((schedule) => ({ ...schedule })),
      step: this.step
    };
  }
  saveDraft() {
    const draft = this.draftSnapshot();
    this.draftSaveChain = this.draftSaveChain.then(() => this.onDraft(draft));
    return this.draftSaveChain;
  }
  scheduleDraftSave() {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => {
      this.draftTimer = null;
      void this.saveDraft();
    }, 500);
  }
  async flushDraft() {
    if (this.draftTimer !== null) {
      window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      await this.saveDraft();
      return;
    }
    await this.draftSaveChain;
  }
  onClose() {
    this.contentEl.empty();
    this.modalEl.removeClass("sv-course-modal-shell");
    if (!this.submitted) {
      if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
      this.draftTimer = null;
      void this.saveDraft();
    }
  }
};

// src/commands/course.ts
function buildScheduleYaml(schedules) {
  if (!schedules.length) return "schedule: []";
  const lines = ["schedule:"];
  for (const schedule of schedules) {
    const parsed = parsePeriod(schedule.period);
    const period = parsed ? parsed.text : schedule.period;
    const id = schedule.id || makeScheduleId(schedule.day, period);
    lines.push(`  - id: "${escapeYamlString(id)}"`);
    lines.push(`    day: "${escapeYamlString(schedule.day)}"`);
    lines.push(`    period: "${escapeYamlString(period)}"`);
    lines.push(`    location: "${escapeYamlString(schedule.online ? "" : schedule.location ?? "")}"`);
    lines.push(`    online: ${schedule.online ? "true" : "false"}`);
  }
  return lines.join("\n");
}
async function createCourseFromForm(app, data) {
  const courseName = data.courseName.trim();
  const courseFolderName = sanitizeFileName(courseName);
  if (!courseFolderName) {
    notice(t("invalidCourseName"));
    return null;
  }
  if (courseFolderName === "." || courseFolderName === "..") {
    notice(t("unusableCourseName"));
    return null;
  }
  const courseFolder = `${UNIVERSITY_ROOT}/${data.semester}/${courseFolderName}`;
  const coursePath = `${courseFolder}/${courseFolderName}.md`;
  if (await exists(app, coursePath)) {
    await openPath(app, coursePath);
    notice(t("courseAlreadyOpened"));
    return null;
  }
  await ensureFolder(app, `${courseFolder}/Lectures`);
  const template = getTemplateSet().course.replace(/^schedule:\s*\[\]\s*$/m, buildScheduleYaml(data.schedules));
  const content = renderTemplate(template, {
    SEMESTER: escapeYamlString(data.semester),
    COURSE_NAME_YAML: escapeYamlString(courseName),
    COURSE_NAME: courseName,
    COURSE_FOLDER: courseFolder,
    ...managedTimestampValues()
  });
  const created = await createFileIfMissing(app, coursePath, content);
  if (!created) return null;
  await appendCourseToSemesterIndex(app, data.semester, coursePath, courseName);
  notice(t("courseCreated", { name: courseName }));
  return { path: coursePath };
}
function uniqueRecent(values, existing, limit = 20) {
  return [.../* @__PURE__ */ new Set([...values.filter(Boolean), ...existing.filter(Boolean)])].slice(0, limit);
}
function buildDraft(store) {
  return store.getData().courseDraft ?? {
    semester: store.getData().lastSemester,
    courseName: "",
    schedules: [],
    step: 0
  };
}
function collectLocations(app, store) {
  const fromCourses = loadCourses(app).flatMap((course) => course.schedule).map((schedule) => schedule.location?.trim() ?? "").filter(Boolean);
  return uniqueRecent(store.getData().recentLocations, fromCourses);
}
async function createCourseCommand(app, store) {
  new CourseCreateModal(
    app,
    collectLocations(app, store),
    buildDraft(store),
    async (draft) => store.updateData({ courseDraft: draft }),
    async (data) => {
      if (!data) return;
      try {
        const created = await createCourseFromForm(app, data);
        if (!created) return;
        await store.updateData({
          courseDraft: void 0,
          lastSemester: data.semester,
          recentLocations: uniqueRecent(
            data.schedules.map((schedule) => schedule.location ?? ""),
            store.getData().recentLocations
          ),
          recentCoursePaths: uniqueRecent([created.path], store.getData().recentCoursePaths, 10)
        });
        await openPath(app, created.path);
      } catch (error) {
        console.error(error);
        notice(t("courseCreateError", { error: error.message ?? error }));
      }
    }
  ).open();
}

// src/commands/lecture.ts
var import_obsidian4 = require("obsidian");

// src/modals/QuickLectureModal.ts
var import_obsidian3 = require("obsidian");
var QuickLectureModal = class extends import_obsidian3.Modal {
  constructor(app, courseName, onSubmit) {
    super(app);
    this.courseName = courseName;
    this.onSubmit = onSubmit;
    this.title = "";
    this.content = "";
    this.task = "";
  }
  onOpen() {
    this.modalEl.addClass("sv-quick-lecture-modal");
    this.titleEl.setText(t("quickTitle"));
    this.contentEl.empty();
    this.contentEl.createEl("p", {
      text: t("quickDesc", { course: this.courseName }),
      cls: "sv-modal-desc"
    });
    new import_obsidian3.Setting(this.contentEl).setName(t("title")).setDesc(t("lectureTitleDesc")).addText((input) => {
      input.setPlaceholder(t("titlePlaceholder"));
      input.setValue(this.title);
      input.inputEl.focus();
      input.onChange((value) => this.title = value);
    });
    new import_obsidian3.Setting(this.contentEl).setName(t("content")).setDesc(t("contentDesc")).addTextArea((input) => {
      input.setPlaceholder(t("contentPlaceholder"));
      input.setValue(this.content);
      input.inputEl.rows = 8;
      input.onChange((value) => this.content = value);
    });
    new import_obsidian3.Setting(this.contentEl).setName(t("optionalTask")).setDesc(t("taskDesc")).addText((input) => {
      input.setPlaceholder(t("taskPlaceholder"));
      input.setValue(this.task);
      input.onChange((value) => this.task = value);
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
  async submit() {
    const title = this.title.trim();
    if (!title) {
      this.contentEl.querySelector("input")?.focus();
      return;
    }
    await this.onSubmit({ title, content: this.content.trim(), task: this.task.trim() });
    this.close();
  }
};

// src/commands/lecture.ts
function buildLectureFileName(data) {
  if (data.quick?.title) {
    return `${data.date}-${sanitizeFileName(data.quick.title)}.md`;
  }
  const slot = `${data.classDay}${data.classPeriod}` || data.date;
  return `${pad2(data.week)}${getPluginLanguage() === "ko" ? "\uC8FC\uCC28" : "week"}-${slot}.md`;
}
async function rememberCourse(store, coursePath) {
  const current = store.getData().recentCoursePaths;
  await store.updateData({
    recentCoursePaths: [coursePath, ...current.filter((path) => path !== coursePath)].slice(0, 10)
  });
}
async function createLectureNote(app, data, store) {
  const fileName = sanitizeFileName(buildLectureFileName(data));
  if (!fileName || fileName === ".md" || fileName === "..md") {
    notice(t("lectureFileNameError"));
    return;
  }
  const lecturePath = `${data.course.lecturesFolder}/${fileName}`;
  if (await exists(app, lecturePath)) {
    await openPath(app, lecturePath);
    await rememberCourse(store, data.course.path);
    notice(t("lectureExists", { file: fileName }));
    return;
  }
  const courseLink = makeWikiLink(data.course.path, data.course.courseName);
  let content = renderTemplate(getTemplateSet().lecture, {
    COURSE_LINK_YAML: escapeYamlString(courseLink),
    COURSE_LINK: courseLink,
    SEMESTER: escapeYamlString(data.course.semester),
    WEEK: data.week,
    DATE: data.date,
    SESSION_TYPE_FIELD: data.sessionType ? `sessionType: "${escapeYamlString(data.sessionType)}"
` : "",
    CLASS_DAY_FIELD: data.classDay ? `classDay: "${escapeYamlString(data.classDay)}"
` : "",
    CLASS_PERIOD_FIELD: data.classPeriod ? `classPeriod: "${escapeYamlString(data.classPeriod)}"
` : "",
    LOCATION_FIELD: data.location ? `location: "${escapeYamlString(data.location)}"
` : "",
    ONLINE_FIELD: data.online ? "online: true\n" : "",
    CLASS_INFO: data.classDay && data.classPeriod ? ` \xB7 ${data.classDay} ${t("period", { period: data.classPeriod })}` : "",
    CLASS_DAY: data.classDay,
    CLASS_PERIOD: data.classPeriod,
    TITLE: escapeYamlString(data.quick?.title ?? t("lecture")),
    LECTURE_SECTIONS: renderLectureSections(data.quick?.task, getPluginLanguage()),
    ...managedTimestampValues()
  });
  content = content.split(escapeYamlString(courseLink)).join(courseLink);
  if (data.quick) {
    const body = data.quick.content.trim();
    const notesHeading = getPluginLanguage() === "en" ? "## Notes" : "## \uD544\uAE30";
    const conceptsHeading = getPluginLanguage() === "en" ? "## Key concepts" : "## \uD575\uC2EC \uAC1C\uB150";
    if (body) content = content.replace(`${notesHeading}

- `, `${notesHeading}

${body}`);
    else content = content.replace(new RegExp(`\\n${notesHeading}\\n\\n- \\n?`), "");
    content = content.replace(new RegExp(`\\n${conceptsHeading}\\n\\n- \\n?`), "");
  }
  const file = await createFileIfMissing(app, lecturePath, content);
  if (!file) {
    notice(t("lectureExists", { file: fileName }));
    return;
  }
  await app.workspace.getLeaf(true).openFile(file);
  await rememberCourse(store, data.course.path);
  notice(t("lectureCreated", { file: fileName }));
}
var MatchSuggestModal = class extends import_obsidian4.FuzzySuggestModal {
  constructor(app, matches, onPick) {
    super(app);
    this.matches = matches;
    this.onPick = onPick;
    this.setPlaceholder(t("chooseTodayClass"));
  }
  getItems() {
    return this.matches;
  }
  getItemText(item) {
    return item.label;
  }
  onChooseItem(item) {
    this.onPick(item);
  }
};
var CourseSuggestModal = class extends import_obsidian4.FuzzySuggestModal {
  constructor(app, courses, onPick) {
    super(app);
    this.courses = courses;
    this.onPick = onPick;
    this.setPlaceholder(t("chooseCourse"));
  }
  getItems() {
    return this.courses;
  }
  getItemText(item) {
    return `${item.semester} \xB7 ${item.courseName}`;
  }
  onChooseItem(item) {
    this.onPick(item);
  }
};
function sortByRecent(courses, recentPaths) {
  const recentOrder = new Map(recentPaths.map((path, index) => [path, index]));
  return [...courses].sort((a, b) => {
    const aOrder = recentOrder.get(a.path) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = recentOrder.get(b.path) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}
async function createForCourseToday(app, course, store) {
  const [todayMatch] = todayMatchingSchedules([course]);
  if (todayMatch) {
    await createLectureForMatch(app, todayMatch, store);
    return;
  }
  await createLectureNote(
    app,
    {
      course,
      week: 1,
      date: todayText(),
      sessionType: "extra",
      classDay: "",
      classPeriod: "",
      location: "",
      online: false
    },
    store
  );
}
async function chooseCourseForToday(app, store) {
  const courses = sortByRecent(loadCourses(app), store.getData().recentCoursePaths);
  if (courses.length === 0) {
    notice(t("noCourses"));
    return;
  }
  if (courses.length === 1) {
    await createForCourseToday(app, courses[0], store);
    return;
  }
  new CourseSuggestModal(app, courses, (course) => void createForCourseToday(app, course, store)).open();
}
async function createLectureForMatch(app, match, store) {
  await createLectureNote(
    app,
    {
      course: match.course,
      week: Number(match.week) || 1,
      date: match.date,
      sessionType: "regular",
      classDay: match.schedule.day ?? "",
      classPeriod: match.schedule.period ?? "",
      location: match.schedule.online ? "" : match.schedule.location ?? "",
      online: Boolean(match.schedule.online)
    },
    store
  );
}
async function createLectureCommand(app, store) {
  const courses = loadCourses(app);
  if (courses.length === 0) {
    notice(t("noCoursesCommand"));
    return;
  }
  const studying = courses.filter((course) => course.status === "studying");
  const matches = todayMatchingSchedules(studying.length > 0 ? studying : courses);
  if (matches.length === 1 || matches[0]?.phase === "current") {
    await createLectureForMatch(app, matches[0], store);
    return;
  }
  if (matches.length > 1) {
    new MatchSuggestModal(app, matches, async (picked) => {
      await createLectureForMatch(app, picked, store);
    }).open();
    return;
  }
  await chooseCourseForToday(app, store);
}
async function createQuickLectureForCourse(app, course, store) {
  const [todayMatch] = todayMatchingSchedules([course]);
  const match = todayMatch;
  new QuickLectureModal(app, course.courseName, async (quick) => {
    await createLectureNote(
      app,
      {
        course,
        week: Number(match?.week) || 1,
        date: todayText(),
        sessionType: match ? "regular" : "extra",
        classDay: match?.schedule.day ?? "",
        classPeriod: match?.schedule.period ?? "",
        location: match?.schedule.online ? "" : match?.schedule.location ?? "",
        online: Boolean(match?.schedule.online),
        quick
      },
      store
    );
  }).open();
}
async function createQuickLectureCommand(app, store, selectedCourse) {
  const courses = sortByRecent(loadCourses(app), store.getData().recentCoursePaths);
  if (!courses.length) {
    notice(t("noCoursesCommand"));
    return;
  }
  if (selectedCourse) {
    const current = courses.find((course) => course.path === selectedCourse.path) ?? selectedCourse;
    await createQuickLectureForCourse(app, current, store);
    return;
  }
  if (courses.length === 1) {
    await createQuickLectureForCourse(app, courses[0], store);
    return;
  }
  new CourseSuggestModal(app, courses, (course) => void createQuickLectureForCourse(app, course, store)).open();
}

// src/modals/CourseOverviewModal.ts
var import_obsidian5 = require("obsidian");

// src/query/lectures.ts
function loadLectures(app, folderPrefix) {
  return getMarkdownFiles(app).map((file) => {
    const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    if (fm.type !== "lecture") return null;
    const folder = normalizePath(file.parent?.path ?? "");
    if (folderPrefix && !folder.startsWith(normalizePath(folderPrefix))) return null;
    return {
      file,
      path: file.path,
      week: String(fm.week ?? ""),
      date: String(fm.date ?? "").slice(0, 10),
      sessionType: String(fm.sessionType ?? ""),
      classDay: String(fm.classDay ?? ""),
      classPeriod: String(fm.classPeriod ?? ""),
      folder
    };
  }).filter((row) => Boolean(row)).sort((a, b) => Number(a.week) - Number(b.week) || a.date.localeCompare(b.date));
}

// src/query/tasks.ts
var DUE_RE = /📅\s*(\d{4}-\d{2}-\d{2})/;
var PRIORITY_RE = /(?:⏫|🔼|🔽|⏬|🔺)/;
var TAG_RE = /#([\w가-힣/-]+)/g;
function priorityFromEmoji(raw) {
  if (raw.includes("\u{1F53A}") || raw.includes("\u23EB")) return "highest";
  if (raw.includes("\u{1F53C}")) return "high";
  if (raw.includes("\u{1F53D}")) return "low";
  if (raw.includes("\u23EC")) return "lowest";
  return "";
}
function parseTaskLine(line, lineIndex = 0) {
  const match = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (!match) return null;
  const done = match[2].toLowerCase() === "x";
  const body = match[3];
  const dueMatch = body.match(DUE_RE);
  const tags = Array.from(body.matchAll(TAG_RE)).map((item) => item[1]);
  return {
    done,
    text: body.replace(DUE_RE, "").replace(PRIORITY_RE, "").replace(TAG_RE, "").replace(/\s+/g, " ").trim(),
    due: dueMatch?.[1] ?? "",
    priority: priorityFromEmoji(body),
    tags,
    lineIndex,
    raw: line
  };
}
function parseTasksFromContent(content) {
  return content.split(/\r?\n/).map((line, index) => parseTaskLine(line, index)).filter((task) => Boolean(task));
}
function groupOpenTasks(tasks, today, upcomingDays = 7) {
  const end = addIsoDays(today, upcomingDays);
  const groups = { overdue: [], today: [], upcoming: [], undated: [] };
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
function addIsoDays(value, days) {
  const date = /* @__PURE__ */ new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + Math.max(0, days));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function filterTasks(tasks, filter) {
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
function sortTasks(tasks) {
  const priorityOrder = {
    highest: 0,
    high: 1,
    medium: 2,
    "": 3,
    low: 4,
    lowest: 5
  };
  return [...tasks].sort((a, b) => {
    const priority = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    if (priority !== 0) return priority;
    return (a.due || "9999").localeCompare(b.due || "9999");
  });
}
function toggleTaskLine(line) {
  if (/\[[ ]\]/.test(line)) return line.replace("[ ]", "[x]");
  if (/\[[xX]\]/.test(line)) return line.replace(/\[[xX]\]/, "[ ]");
  return line;
}
function parseCodeblockOptions(source) {
  const options = {};
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

// src/query/vaultTasks.ts
async function openVaultTask(app, task) {
  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(task.file, { state: { mode: "source" } });
  const view = leaf.view;
  const position = { line: Math.max(0, task.lineIndex), ch: 0 };
  view.editor?.setCursor(position);
  view.editor?.scrollIntoView?.({ from: position, to: position }, true);
}
async function loadVaultTasks(app, pathIncludes) {
  const pathFilters = typeof pathIncludes === "string" ? [pathIncludes] : pathIncludes ?? [];
  const files = getMarkdownFiles(app).filter((file) => {
    if (!pathFilters.length) return true;
    return pathFilters.some((path) => file.path.includes(path));
  });
  const tasks = [];
  for (const file of files) {
    const content = await getCachedFileContent(app, file);
    for (const task of parseTasksFromContent(content)) {
      tasks.push({ ...task, file, path: file.path });
    }
  }
  return tasks;
}
async function queryTasks(app, source, defaultPathIncludes) {
  const options = parseCodeblockOptions(source);
  const pathIncludes = options["path includes"] || options.path || "";
  const dueOn = options["due on"] || "";
  const dueToday = options["due today"] === "true" || Object.prototype.hasOwnProperty.call(options, "due today");
  const notDone = options["not done"] === "true" || Object.prototype.hasOwnProperty.call(options, "not done");
  const tasks = await loadVaultTasks(app, pathIncludes || defaultPathIncludes);
  return sortTasks(
    filterTasks(tasks, {
      notDone,
      dueOn: dueOn || void 0,
      dueToday,
      today: todayText()
    })
  );
}
async function toggleVaultTask(app, task) {
  const content = await app.vault.read(task.file);
  const lines = content.split(/\r?\n/);
  let lineIndex = task.lineIndex;
  if (lineIndex < 0 || lineIndex >= lines.length || lines[lineIndex] !== task.raw) {
    lineIndex = lines.findIndex((line) => line === task.raw);
  }
  if (lineIndex < 0) {
    notice(t("taskToggleFailed"));
    return false;
  }
  lines[lineIndex] = toggleTaskLine(lines[lineIndex]);
  await app.vault.modify(task.file, lines.join("\n"));
  return true;
}

// src/modals/CourseOverviewModal.ts
var CourseOverviewModal = class extends import_obsidian5.Modal {
  constructor(app, course, onQuickLecture) {
    super(app);
    this.course = course;
    this.onQuickLecture = onQuickLecture;
  }
  async onOpen() {
    this.modalEl.addClass("sv-course-overview-modal");
    this.titleEl.setText(`${this.course.courseName} \xB7 ${t("courseView")}`);
    this.contentEl.empty();
    const body = this.contentEl.createDiv({ cls: "sv-course-overview" });
    const open = body.createEl("button", { text: t("openCourseNote"), cls: "sv-btn sv-btn-ghost" });
    open.addEventListener("click", () => {
      const file = this.app.vault.getAbstractFileByPath(this.course.path);
      if (file instanceof import_obsidian5.TFile) void this.app.workspace.getLeaf(false).openFile(file);
    });
    const record = body.createEl("button", { text: t("quickLecture"), cls: "sv-btn sv-btn-primary" });
    (0, import_obsidian5.setIcon)(record, "pencil");
    record.addEventListener("click", () => void this.onQuickLecture());
    const metadata = body.createDiv({ cls: "sv-course-overview-meta" });
    metadata.createEl("span", { text: `${t("semester")}: ${this.course.semester}`, cls: "sv-course-semester" });
    new import_obsidian5.Setting(metadata).setName(t("status")).setDesc(t("statusDesc")).addDropdown((dropdown) => {
      dropdown.addOptions({
        studying: t("studying"),
        completed: t("completed"),
        paused: t("paused")
      });
      dropdown.setValue(["studying", "completed", "paused"].includes(this.course.status) ? this.course.status : "studying");
      dropdown.onChange(async (value) => {
        const file = this.app.vault.getAbstractFileByPath(this.course.path);
        if (!(file instanceof import_obsidian5.TFile)) return;
        try {
          await this.app.fileManager.processFrontMatter(file, (frontmatter2) => {
            frontmatter2.status = value;
          });
          this.course.status = value;
          new import_obsidian5.Notice(t("statusChanged", { status: value === "studying" ? t("studying") : value === "completed" ? t("completed") : t("paused") }));
        } catch (error) {
          new import_obsidian5.Notice(t("statusSaveFailed", { error: error.message ?? error }));
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
          text: `${item.date} \xB7 ${item.day} \xB7 ${t("period", { period: item.period })} \xB7 ${periodToTime(item.period)}`
        });
      }
    }
    const lectures = body.createDiv({ cls: "sv-course-overview-section" });
    lectures.createEl("h3", { text: t("recentLectures") });
    const recent = loadLectures(this.app, this.course.lecturesFolder).sort((a, b) => b.file.stat.mtime - a.file.stat.mtime).slice(0, 5);
    if (!recent.length) {
      lectures.createEl("p", { text: t("noLectures"), cls: "sv-query-empty" });
    } else {
      const list = lectures.createDiv({ cls: "sv-course-overview-list" });
      for (const lecture of recent) {
        const row = list.createEl("button", { cls: "sv-course-overview-row" });
        row.createEl("strong", { text: lecture.file.basename });
        row.createEl("span", { text: [lecture.date, lecture.week && (getPluginLanguage() === "en" ? `Week ${lecture.week}` : `${lecture.week}\uC8FC\uCC28`)].filter(Boolean).join(" \xB7 ") });
        row.addEventListener("click", () => void this.app.workspace.getLeaf(false).openFile(lecture.file));
      }
    }
    const tasks = body.createDiv({ cls: "sv-course-overview-section" });
    tasks.createEl("h3", { text: t("remainingTasks") });
    const pending = (await loadVaultTasks(this.app, this.course.folder)).filter((task) => !task.done && task.text.trim().length > 0).slice(0, 8);
    renderTasks(tasks, pending, this.app);
  }
};
function renderTasks(container, tasks, app) {
  if (!tasks.length) {
    container.createEl("p", { text: t("noRemainingTasks"), cls: "sv-query-empty" });
    return;
  }
  const list = container.createDiv({ cls: "sv-course-overview-list" });
  for (const task of tasks) {
    const row = list.createEl("button", { cls: "sv-course-overview-row" });
    row.createSpan({ text: task.text || (getPluginLanguage() === "en" ? "(No content)" : "(\uB0B4\uC6A9 \uC5C6\uC74C)") });
    if (task.due) row.createEl("small", { text: `\u{1F4C5} ${task.due}`, cls: "sv-task-due" });
    row.addEventListener("click", () => void openVaultTask(app, task));
  }
}
function nextSchedules(course) {
  const now = /* @__PURE__ */ new Date();
  const today = (now.getDay() + 6) % 7;
  return (course.schedule ?? []).map((schedule) => {
    const day = DAYS.indexOf(schedule.day);
    if (day < 0) return null;
    const delta = (day - today + 7) % 7;
    const date = new Date(now);
    date.setDate(now.getDate() + delta);
    return {
      day: schedule.day,
      period: schedule.period,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      sort: delta
    };
  }).filter((value) => Boolean(value)).sort((a, b) => a.sort - b.sort || a.period.localeCompare(b.period)).slice(0, 3).map(({ day, period, date }) => ({ day, period, date }));
}

// src/commands/courseView.ts
var import_obsidian6 = require("obsidian");
var CoursePicker = class extends import_obsidian6.FuzzySuggestModal {
  constructor(app, courses, onPick) {
    super(app);
    this.courses = courses;
    this.onPick = onPick;
    this.setPlaceholder(t("chooseCourseView"));
  }
  getItems() {
    return this.courses;
  }
  getItemText(item) {
    return `${item.semester} \xB7 ${item.courseName}`;
  }
  onChooseItem(item) {
    this.onPick(item);
  }
};
async function openCourseViewCommand(app, store) {
  const courses = loadCourses(app);
  if (!courses.length) {
    notice(t("noCoursesCommand"));
    return;
  }
  const open = (course) => {
    new CourseOverviewModal(app, course, () => createQuickLectureCommand(app, store, course)).open();
  };
  if (courses.length === 1) {
    open(courses[0]);
    return;
  }
  new CoursePicker(app, courses, open).open();
}

// src/modals/IntegrityModal.ts
var import_obsidian8 = require("obsidian");

// src/core/integrity.ts
var import_obsidian7 = require("obsidian");
var MANAGED_TYPES2 = /* @__PURE__ */ new Set(["daily", "university", "lecture", "single"]);
var GENERATED_TYPES = /* @__PURE__ */ new Set(["daily", "university", "lecture", "semester-index", "dashboard"]);
function frontmatter(app, file) {
  return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
}
function isUniversityPath(path) {
  const normalized = normalizePath(path);
  return normalized.startsWith(`${UNIVERSITY_ROOT}/`) && !normalized.includes("/Common/") && !normalized.includes("/Exports/");
}
function isValidSemester(value) {
  return /^\d{4}-(?:1|2)$/.test(String(value ?? "").trim());
}
function hasValidManagedLocation(type, path) {
  const normalized = normalizePath(path);
  if (type === "dashboard") return normalized === "00_Home.md";
  if (type === "daily") return normalized.startsWith("10_Daily/");
  if (type === "university") return /^20_University\/\d{4}-[12]\/[^/]+\/[^/]+\.md$/.test(normalized);
  if (type === "lecture") return isUniversityPath(path) && normalized.includes("/Lectures/");
  if (type === "semester-index") return /^20_University\/\d{4}-[12]\/00_.+\.md$/.test(normalized);
  return true;
}
function linkTarget(link) {
  const raw = link.replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].trim();
  return normalizePath(raw.endsWith(".md") ? raw : `${raw}.md`);
}
async function inspectVaultIntegrity(app) {
  const files = getMarkdownFiles(app);
  const issues = [];
  const courses = /* @__PURE__ */ new Map();
  const references = [];
  const lectures = /* @__PURE__ */ new Map();
  for (const file of files) {
    const fm = frontmatter(app, file);
    const type = String(fm.type ?? "");
    const normalizedPath = normalizePath(file.path);
    const hasCreated = String(fm.created ?? "").trim().length > 0;
    const hasUpdated = String(fm.updated ?? "").trim().length > 0;
    if (MANAGED_TYPES2.has(type) && (!hasCreated || !hasUpdated)) {
      issues.push({
        kind: "timestamp",
        path: file.path,
        message: t("integrityTimestamp", {
          fields: `${!hasCreated ? "created" : ""}${!hasCreated && !hasUpdated ? ", " : ""}${!hasUpdated ? "updated" : ""}`
        }),
        safeFix: true
      });
    }
    if (MANAGED_TYPES2.has(type) && !hasValidManagedLocation(type, file.path)) {
      issues.push({
        kind: "file",
        path: file.path,
        message: t("integrityLocation", { type }),
        safeFix: false
      });
    }
    if (!type && /^20_University\/\d{4}-[12]\/[^/]+\/[^/]+\.md$/.test(normalizedPath)) {
      const parts = normalizedPath.split("/");
      if (parts[2] === file.parent?.name && file.basename === parts[2]) {
        issues.push({
          kind: "file",
          path: file.path,
          message: t("integrityMissingType"),
          safeFix: false
        });
      }
    }
    if (type === "university") {
      const key = `${String(fm.semester ?? "").trim()}|${String(fm.courseName ?? "").trim().toLocaleLowerCase()}`;
      if (key !== "|") courses.set(key, [...courses.get(key) ?? [], file]);
      const schedule = fm.schedule;
      const scheduleValid = Array.isArray(schedule) && schedule.every((item) => {
        if (!item || typeof item !== "object") return false;
        const value = item;
        return /^[월화수목금토일]$/.test(String(value.day ?? "")) && Boolean(parsePeriod(String(value.period ?? "")));
      });
      const courseName = String(fm.courseName ?? "").trim();
      const status = String(fm.status ?? "").trim();
      if (!courseName || courseName.includes("{{") || !isValidSemester(fm.semester) || !["studying", "completed", "paused"].includes(status) || !scheduleValid) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityCourseMetadata"),
          safeFix: false
        });
      }
      const parts = normalizedPath.split("/");
      const pathSemester = parts[1] ?? "";
      const pathCourse = parts[2] ?? "";
      const expectedName = sanitizeFileName(courseName);
      if (pathSemester !== String(fm.semester ?? "").trim()) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integritySemesterMismatch", { metadata: String(fm.semester ?? ""), path: pathSemester }),
          safeFix: false
        });
      }
      if (pathCourse !== expectedName || file.basename !== expectedName) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityCourseNameMismatch", { path: `${pathCourse}/${file.basename}`, name: courseName }),
          safeFix: false
        });
      }
    }
    if (type === "lecture") {
      const key = `${String(fm.course ?? "").trim()}|${String(fm.week ?? "").trim()}|${String(fm.date ?? "").trim()}|${String(fm.sessionType ?? "").trim()}`;
      if (key !== "|||") lectures.set(key, [...lectures.get(key) ?? [], file]);
      const lectureContent = await app.vault.cachedRead(file);
      const body = lectureContent.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
      const meaningful = body.split(/\r?\n/).map((line) => line.trim()).filter(
        (line) => line && !/^#+\s/.test(line) && !/^\[\[.*\]\]$/.test(line) && !/^>\s/.test(line) && !/^-\s*(?:\[[ xX]\])?\s*$/.test(line)
      );
      if (!meaningful.length) {
        issues.push({
          kind: "file",
          path: file.path,
          message: t("integrityEmptyLecture"),
          safeFix: false
        });
      }
      const lectureParts = normalizedPath.split("/");
      const lectureSemester = lectureParts[1] ?? "";
      if (lectureSemester && String(fm.semester ?? "").trim() && lectureSemester !== String(fm.semester).trim()) {
        issues.push({
          kind: "course",
          path: file.path,
          message: t("integrityLectureSemesterMismatch", { metadata: String(fm.semester), path: lectureSemester }),
          safeFix: false
        });
      }
    }
    if (GENERATED_TYPES.has(type)) {
      const content = await app.vault.cachedRead(file);
      for (const match of content.matchAll(/\[\[([^\]]+)\]\]/g)) {
        const target = linkTarget(match[0]);
        if (target && target !== ".md") references.push({ file, target });
      }
    }
  }
  for (const [key, duplicates] of courses) {
    if (duplicates.length > 1) {
      issues.push({
        kind: "duplicate",
        path: duplicates.map((file) => file.path).join(", "),
        message: t("integrityDuplicateCourse", { count: duplicates.length }),
        safeFix: false
      });
    }
    if (key.startsWith("|") || key.endsWith("|")) {
      for (const file of duplicates) {
        issues.push({ kind: "course", path: file.path, message: t("integrityEmptyCourse"), safeFix: false });
      }
    }
  }
  for (const [, duplicates] of lectures) {
    if (duplicates.length > 1) {
      issues.push({
        kind: "duplicate",
        path: duplicates.map((file) => file.path).join(", "),
        message: t("integrityDuplicateLecture", { count: duplicates.length }),
        safeFix: false
      });
    }
  }
  for (const reference of references) {
    if (!app.vault.getAbstractFileByPath(reference.target)) {
      issues.push({
        kind: "reference",
        path: reference.file.path,
        message: t("integrityMissingReference", { target: reference.target }),
        safeFix: false
      });
    }
  }
  return { issues, checkedFiles: files.length, fixed: 0 };
}
async function fixSafeIntegrityIssues(app, report) {
  let fixed = 0;
  for (const issue of report.issues) {
    if (!issue.safeFix || issue.kind !== "timestamp") continue;
    const file = app.vault.getAbstractFileByPath(issue.path);
    if (!(file instanceof import_obsidian7.TFile)) continue;
    await updateManagedFileTimestamp(app, file);
    fixed += 1;
  }
  return { ...report, fixed };
}

// src/modals/IntegrityModal.ts
var IntegrityModal = class extends import_obsidian8.Modal {
  constructor() {
    super(...arguments);
    this.report = null;
  }
  onOpen() {
    this.modalEl.addClass("sv-integrity-modal");
    this.titleEl.setText(t("integrityTitle"));
    void this.scan();
  }
  async scan() {
    this.contentEl.empty();
    this.contentEl.createEl("p", { text: t("integrityScanning"), cls: "sv-modal-desc" });
    this.report = await inspectVaultIntegrity(this.app);
    this.render();
  }
  render() {
    if (!this.report) return;
    this.contentEl.empty();
    const safe = this.report.issues.filter((issue) => issue.safeFix);
    this.contentEl.createEl("p", {
      text: t("integritySummary", { files: this.report.checkedFiles, issues: this.report.issues.length }),
      cls: "sv-modal-desc"
    });
    if (!this.report.issues.length) {
      this.contentEl.createEl("p", { text: t("integrityNone"), cls: "sv-integrity-success" });
    } else {
      const list = this.contentEl.createEl("ul", { cls: "sv-integrity-list" });
      for (const issue of this.report.issues.slice(0, 100)) {
        const item = list.createEl("li");
        item.createEl("strong", { text: `[${labelFor(issue)}] ` });
        item.createSpan({ text: issue.message });
        item.createEl("small", { text: ` \xB7 ${issue.path}`, cls: "sv-integrity-path" });
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
};
function labelFor(issue) {
  return {
    timestamp: "timestamp",
    course: "course metadata",
    reference: "generated reference",
    duplicate: "duplicate",
    file: "file location"
  }[issue.kind];
}

// src/core/pluginData.ts
var DEFAULT_SUPPORT_URL = "https://github.com/sponsors/zzeroneko";
var DEFAULT_PLUGIN_DATA = {
  schemaVersion: 2,
  language: getDefaultLanguage("en"),
  recentLocations: [],
  recentCoursePaths: [],
  lastSemester: getDefaultSemesters()[1],
  supportUrl: DEFAULT_SUPPORT_URL
};

// src/core/homeMigration.ts
var MANAGED_HOME_HEADINGS = /* @__PURE__ */ new Set([
  "\uC624\uB298 \uD560 \uC77C",
  "\uC774\uBC88 \uC8FC \uC2DC\uD5D8\xB7\uC218\uC5C5",
  "\uC218\uAC15 \uACFC\uBAA9"
]);
function isManagedHomeHeading(line) {
  const heading = line.replace(/^##\s+/, "").trim();
  return MANAGED_HOME_HEADINGS.has(heading) || /^\d{4}-.+\s+아카이브$/.test(heading);
}
function migrateHomeContent(content) {
  if (content.includes("```univvault-dashboard")) return content;
  const lines = content.split(/\r?\n/);
  const preserved = [];
  let skippingManagedSection = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      skippingManagedSection = isManagedHomeHeading(line);
      if (skippingManagedSection) continue;
    }
    if (skippingManagedSection) continue;
    if (/^\[\[00_Home\|Home\]\]\s+·/.test(line)) continue;
    if (/^>\s*명령 팔레트\s*\/\s*리본:/.test(line)) continue;
    preserved.push(line);
  }
  const normalized = preserved.join("\n").replace(/^#\s+(?:StudyVault|univVault)$/m, "# StudyFlow").trimEnd();
  const dashboard = "```univvault-dashboard\n```";
  const titleMatch = normalized.match(/^#\s+StudyFlow\s*$/m);
  if (!titleMatch || titleMatch.index === void 0) {
    return `${HOME_TEMPLATE.trimEnd()}

${normalized}
`;
  }
  const insertAt = titleMatch.index + titleMatch[0].length;
  return `${normalized.slice(0, insertAt)}

${dashboard}${normalized.slice(insertAt)}
`.replace(/\n{3,}/g, "\n\n");
}

// src/core/scaffold.ts
var CURRENT_SCHEMA_VERSION = 2;
var HOME_PATH = "00_Home.md";
async function ensureScaffold(app) {
  for (const folder of [
    DAILY_FOLDER,
    UNIVERSITY_ROOT
  ]) {
    await ensureFolder(app, folder);
  }
  await createFileIfMissing(app, HOME_PATH, getTemplateSet().home);
}
async function migrateScaffold(app, fromVersion) {
  if (fromVersion >= CURRENT_SCHEMA_VERSION) return;
  const home = app.vault.getAbstractFileByPath(HOME_PATH);
  if (home && "extension" in home) {
    const file = home;
    const current = await app.vault.read(file);
    const migrated = migrateHomeContent(current);
    if (migrated !== current) await app.vault.modify(file, migrated);
  }
}

// src/query/courses.ts
function queryCourses(app, options = {}) {
  return loadCourses(app, {
    status: options.status,
    semester: options.semester
  }).filter((course) => {
    if (!options.folderPrefix) return true;
    return course.path.startsWith(options.folderPrefix.replace(/\\/g, "/"));
  });
}

// src/query/personalStudy.ts
function loadPersonalStudyNotes(app) {
  return getMarkdownFiles(app).filter((file) => normalizePath(file.path).startsWith(`${PERSONAL_STUDY_ROOT}/`)).map((file) => ({
    file,
    path: file.path,
    title: file.basename,
    modified: file.stat.mtime
  })).sort((a, b) => b.modified - a.modified || a.title.localeCompare(b.title, "ko"));
}

// src/query/processors.ts
function emptyState(el, text) {
  el.createEl("p", { text, cls: "sv-query-empty" });
}
function renderTable(el, headers, rows) {
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
function openPath2(app, path) {
  const file = app.vault.getAbstractFileByPath(path);
  if (file && "extension" in file) {
    void app.workspace.getLeaf(false).openFile(file);
  }
}
function renderList(el, app, paths) {
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
      openPath2(app, path);
    });
  });
}
function registerQueryProcessors(plugin) {
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
        attr: { type: "checkbox" }
      });
      checkbox.checked = task.done;
      checkbox.addEventListener("click", async (event) => {
        event.preventDefault();
        await toggleVaultTask(app, task);
      });
      const body = item.createSpan({ cls: "sv-task-body" });
      body.createSpan({ text: task.text || t("noContent") });
      if (task.due) body.createSpan({ text: ` \u{1F4C5} ${task.due}`, cls: "sv-task-due" });
      const open = item.createEl("a", {
        text: `${task.file.path}:${task.lineIndex + 1}`,
        cls: "sv-task-source",
        attr: { title: task.file.path }
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
        status: options.status || void 0,
        semester: options.semester || void 0,
        folderPrefix: options.folder || void 0
      });
      renderList(
        el,
        app,
        courses.map((course) => ({
          path: course.path,
          label: options.showSemester === "true" ? `${course.semester} \xB7 ${course.courseName}` : course.courseName
        }))
      );
      return;
    }
    if (kind === "personal") {
      renderList(
        el,
        app,
        loadPersonalStudyNotes(app).map((note) => ({ path: note.path, label: note.title }))
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
          lecture.classPeriod
        ])
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
            course.status
          ];
        })
      );
      return;
    }
    emptyState(el, t("unknownKind", { type: "table", kind }));
  });
  plugin.registerMarkdownCodeBlockProcessor("univvault-info", (_source, el, ctx) => {
    el.empty();
    el.addClass("sv-query-block");
    const current = app.metadataCache.getCache(ctx.sourcePath)?.frontmatter ?? {};
    const fieldMap = {
      major: getPluginLanguage() === "ko" ? "\uC804\uACF5" : "Major",
      liberal: getPluginLanguage() === "ko" ? "\uAD50\uC591" : "Liberal arts"
    };
    const requirementMap = {
      required: getPluginLanguage() === "ko" ? "\uD544\uC218" : "Required",
      elective: getPluginLanguage() === "ko" ? "\uC120\uD0DD" : "Elective"
    };
    const statusMap = {
      studying: t("studying"),
      completed: t("completed"),
      paused: t("paused")
    };
    const field = String(current.courseField ?? "");
    const requirement = String(current.courseRequirement ?? "");
    const rows = [
      [t("semester"), String(current.semester ?? "")],
      [t("courseName"), String(current.courseName ?? "")],
      [t("status"), statusMap[String(current.status ?? "")] ?? String(current.status ?? "")]
    ];
    if (field || requirement) {
      rows.splice(2, 0, [t("type"), `${fieldMap[field] ?? field} ${requirementMap[requirement] ?? requirement}`.trim()]);
    }
    if (current.credits !== void 0 && current.credits !== "") {
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
      schedule.map((item) => [
        String(item.day ?? ""),
        String(item.period ?? ""),
        periodToTime(String(item.period ?? "")),
        item.online ? t("online") : String(item.location ?? "")
      ])
    );
  });
}

// src/processors/DashboardProcessor.ts
var import_obsidian9 = require("obsidian");
function openFile(app, file) {
  void app.workspace.getLeaf(false).openFile(file);
}
function createAction(container, label, icon, action, primary = false) {
  const button = container.createEl("button", {
    cls: `sv-dashboard-action${primary ? " is-primary" : ""}`
  });
  const iconEl = button.createSpan({ cls: "sv-dashboard-action-icon" });
  (0, import_obsidian9.setIcon)(iconEl, icon);
  const text = button.createSpan({ cls: "sv-dashboard-action-text" });
  text.createEl("strong", { text: label });
  button.addEventListener("click", () => {
    void action().catch((error) => console.error("StudyFlow dashboard action failed", error));
  });
}
function createSection(container, title) {
  const section = container.createDiv({ cls: "sv-dashboard-section" });
  section.createEl("h2", { text: title });
  return section;
}
function addMoreButton(container, hidden) {
  if (!hidden.length) return;
  const more = container.createEl("button", {
    text: t("more", { count: hidden.length }),
    cls: "sv-dashboard-more"
  });
  more.addEventListener("click", () => {
    const expanded = more.dataset.expanded === "true";
    hidden.forEach((item) => item.toggleClass("is-hidden", expanded));
    more.dataset.expanded = expanded ? "false" : "true";
    more.setText(expanded ? t("more", { count: hidden.length }) : t("less"));
  });
}
async function renderDashboard(app, el, actions) {
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
      cls: "sv-dashboard-empty"
    });
  } else {
    const list = classesSection.createDiv({ cls: "sv-dashboard-timetable" });
    const hidden = [];
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
        (candidate) => candidate.date === match.date && (!match.schedule.period || candidate.classPeriod === match.schedule.period)
      );
      course.createEl("small", {
        text: [
          match.label.split(" \xB7 ")[0],
          match.schedule.online ? t("online") : match.schedule.location || t("locationUnknown"),
          lecture ? `\u2713 ${t("noteRecorded")}` : t("noteNotRecorded")
        ].join(" \xB7 "),
        cls: lecture ? "is-recorded" : "is-unrecorded"
      });
      const action = item.createSpan({ cls: "sv-dashboard-timetable-action" });
      action.setText(lecture ? t("openNote") : t("record"));
      item.setAttr("aria-label", `${match.label} \xB7 ${lecture ? t("openNote") : t("recordNote")}`);
      item.addEventListener("click", () => {
        if (lecture) openFile(app, lecture.file);
        else void actions.lectureForMatch(match);
      });
    }
    addMoreButton(classesSection, hidden);
  }
  const tasksSection = createSection(grid, t("tasks"));
  const tasks = (await loadVaultTasks(app, ["10_Daily/", "20_University/", "30_Personal/"])).filter((task) => task.text.trim().length > 0);
  const groups = groupOpenTasks(tasks, todayText(), 7);
  const taskGroups = [
    ["overdue", t("overdue")],
    ["today", t("today")],
    ["upcoming", t("upcoming")],
    ["undated", t("undated")]
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
    const hidden = [];
    for (const [index, task] of grouped.entries()) {
      const row = list.createDiv({ cls: `sv-dashboard-task${key === "overdue" ? " is-overdue" : ""}` });
      if (index >= 4) {
        row.addClass("is-hidden");
        hidden.push(row);
      }
      const checkbox = row.createEl("input", { attr: { type: "checkbox" } });
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
          console.error("StudyFlow task toggle failed", error);
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
          task.due && `\u{1F4C5} ${task.due}`,
          `${task.file.basename}:${task.lineIndex + 1}`
        ].filter(Boolean).join(" \xB7 ")
      });
      body.addEventListener("click", () => void openVaultTask(app, task));
    }
    addMoreButton(subsection, hidden);
  }
  const coursesSection = createSection(grid, t("studyingCourses"));
  if (!courses.length) {
    const add = coursesSection.createEl("button", { text: t("firstCourse"), cls: "sv-dashboard-more" });
    add.addEventListener("click", () => void actions.addCourse());
    const guideFile = app.vault.getAbstractFileByPath("00_\uC2DC\uC791\uD558\uAE30.md");
    if (guideFile instanceof import_obsidian9.TFile) {
      const guide = coursesSection.createEl("button", { text: t("gettingStarted"), cls: "sv-dashboard-more" });
      guide.addEventListener("click", () => openFile(app, guideFile));
    }
  } else {
    const chips = coursesSection.createDiv({ cls: "sv-dashboard-courses" });
    const hidden = [];
    for (const [index, course] of courses.entries()) {
      const file = app.vault.getAbstractFileByPath(course.path);
      const button = chips.createEl("button", { text: `${course.semester} \xB7 ${course.courseName}`, cls: "sv-dashboard-course" });
      if (index >= 8) {
        button.addClass("is-hidden");
        hidden.push(button);
      }
      if (file && "extension" in file) {
        button.addEventListener("click", () => openFile(app, file));
      }
    }
    addMoreButton(coursesSection, hidden);
  }
}
var DashboardRefreshChild = class extends import_obsidian9.MarkdownRenderChild {
  constructor(containerEl, app, refresh) {
    super(containerEl);
    this.app = app;
    this.refresh = refresh;
    this.timer = null;
  }
  onload() {
    const schedule = (path) => {
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
  onunload() {
    if (this.timer !== null) window.clearTimeout(this.timer);
  }
};
function registerDashboardProcessor(plugin, actions) {
  plugin.registerMarkdownCodeBlockProcessor("univvault-dashboard", async (_source, el, ctx) => {
    let rendering = false;
    let refreshQueued = false;
    const refresh = async () => {
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

// main.ts
function getObsidianLanguage() {
  const api = obsidian;
  if (typeof api.getLanguage === "function") return api.getLanguage();
  const locale = api.moment?.locale?.();
  return locale ?? "";
}
var UnivVaultSettingTab = class extends import_obsidian10.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian10.Setting(containerEl).setName(t("language")).setDesc(t("languageDesc")).addDropdown((dropdown) => {
      dropdown.addOptions({ ko: t("korean"), en: t("english") });
      dropdown.setValue(this.plugin.getData().language);
      dropdown.onChange(async (value) => {
        const language = value === "en" ? "en" : "ko";
        setLanguage(language);
        await this.plugin.updateData({ language });
        this.display();
      });
    });
    new import_obsidian10.Setting(containerEl).setName(t("supportTitle")).setDesc(
      t("supportDesc")
    ).addText((text) => {
      text.setPlaceholder(DEFAULT_SUPPORT_URL).setValue(this.plugin.getData().supportUrl).onChange(async (value) => {
        await this.plugin.updateData({ supportUrl: value.trim() || DEFAULT_SUPPORT_URL });
      });
    }).addButton((button) => {
      button.setButtonText(t("open"));
      button.onClick(() => {
        const url = this.plugin.getData().supportUrl.trim() || DEFAULT_SUPPORT_URL;
        window.open(url, "_blank");
      });
    });
  }
};
var UnivVaultPlugin = class extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.data = { ...DEFAULT_PLUGIN_DATA };
  }
  getData() {
    return this.data;
  }
  async updateData(patch) {
    this.data = { ...this.data, ...patch };
    await this.saveData(this.data);
  }
  async onload() {
    const loaded = await this.loadData();
    this.data = {
      schemaVersion: loaded?.schemaVersion ?? DEFAULT_PLUGIN_DATA.schemaVersion,
      language: loaded?.language === "en" ? "en" : loaded?.language === "ko" ? "ko" : getDefaultLanguage(getObsidianLanguage()),
      courseDraft: loaded?.courseDraft,
      recentLocations: loaded?.recentLocations ?? [],
      recentCoursePaths: loaded?.recentCoursePaths ?? [],
      lastSemester: loaded?.lastSemester ?? DEFAULT_PLUGIN_DATA.lastSemester,
      supportUrl: typeof loaded?.supportUrl === "string" && loaded.supportUrl.trim() ? loaded.supportUrl.trim() : DEFAULT_SUPPORT_URL
    };
    setLanguage(this.data.language);
    await ensureScaffold(this.app);
    const previousSchemaVersion = loaded?.schemaVersion ?? 0;
    await migrateScaffold(this.app, previousSchemaVersion);
    if (previousSchemaVersion < CURRENT_SCHEMA_VERSION) {
      await this.updateData({ schemaVersion: CURRENT_SCHEMA_VERSION });
    }
    (0, import_obsidian10.addIcon)(
      "univvault-book",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
    );
    registerQueryProcessors(this);
    registerDashboardProcessor(this, {
      daily: () => createOrOpenDaily(this.app),
      lecture: () => createLectureCommand(this.app, this),
      quickLecture: () => createQuickLectureCommand(this.app, this),
      lectureForMatch: (match) => createLectureForMatch(this.app, match, this),
      courseView: () => openCourseViewCommand(this.app, this),
      integrity: async () => new IntegrityModal(this.app).open(),
      addCourse: () => createCourseCommand(this.app, this)
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
      }
    });
    this.addCommand({
      id: "lecture",
      name: t("lecture"),
      callback: async () => {
        await createLectureCommand(this.app, this);
      }
    });
    this.addCommand({
      id: "quick-lecture",
      name: t("quickLecture"),
      callback: async () => {
        await createQuickLectureCommand(this.app, this);
      }
    });
    this.addCommand({
      id: "course-view",
      name: t("courseView"),
      callback: async () => {
        await openCourseViewCommand(this.app, this);
      }
    });
    this.addCommand({
      id: "check-integrity",
      name: t("integrity"),
      callback: () => {
        new IntegrityModal(this.app).open();
      }
    });
    this.addCommand({
      id: "add-course",
      name: t("addCourse"),
      callback: async () => {
        await createCourseCommand(this.app, this);
      }
    });
    this.app.workspace.onLayoutReady(() => {
      void this.openHomeIfNeeded();
    });
    this.registerEvent(this.app.vault.on("modify", (file) => {
      invalidateVaultIndex(this.app, file.path);
      if (file instanceof import_obsidian10.TFile) {
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
  async openHomeIfNeeded() {
    const home = this.app.vault.getAbstractFileByPath("00_Home.md");
    if (!home || !(home instanceof import_obsidian10.TFile)) return;
    const hasOpenMarkdown = this.app.workspace.getLeavesOfType("markdown").some((leaf2) => Boolean(leaf2.view.file));
    if (hasOpenMarkdown) return;
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(home, { state: { mode: "preview" } });
  }
};
