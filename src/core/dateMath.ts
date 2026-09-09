/** Pure date/period helpers — no Obsidian imports (testable). */

export const PERIOD_START: Record<number, string> = {
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
  12: "20:10",
};

export const PERIOD_END: Record<number, string> = {
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
  12: "21:00",
};

export const JS_DAY_TO_KR = ["일", "월", "화", "수", "목", "금", "토"] as const;
export function pad2(value: number | string): string {
  return String(value).padStart(2, "0");
}

export interface PeriodRange {
  start: number;
  end: number;
  text: string;
}

export type SchedulePhase = "current" | "next" | "past" | "unknown";

export function classifyScheduleTime(
  periodText: string | number | null | undefined,
  nowMinutes: number,
): { phase: SchedulePhase; distanceMinutes: number } {
  const normalizedPeriod = String(periodText ?? "");
  const startText = periodStartTime(normalizedPeriod);
  const endText = periodEndTime(normalizedPeriod);
  const toMinutes = (text: string): number => {
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

export function parsePeriod(periodText: string): PeriodRange | null {
  const normalized = String(periodText ?? "")
    .replace(/\s+/g, "")
    .replace(/[~–—]/g, "-");

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
    text: start === end ? String(start) : `${start}-${end}`,
  };
}

export function periodToTime(periodText: string): string {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return `${PERIOD_START[parsed.start]}-${PERIOD_END[parsed.end]}`;
}

export function periodStartTime(periodText: string): string {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return PERIOD_START[parsed.start] ?? "";
}

export function periodEndTime(periodText: string): string {
  const parsed = parsePeriod(periodText);
  if (!parsed) return "";
  return PERIOD_END[parsed.end] ?? "";
}
