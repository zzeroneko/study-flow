import { getDefaultSemesters } from "./constants";
import type { CourseSchedule } from "./constants";
import { getDefaultLanguage, type PluginLanguage } from "./i18n";

export interface CourseDraft {
  semester: string;
  courseName: string;
  schedules: CourseSchedule[];
  step?: number;
}

export interface UnivVaultPluginData {
  schemaVersion: number;
  language: PluginLanguage;
  courseDraft?: CourseDraft;
  recentLocations: string[];
  recentCoursePaths: string[];
  lastSemester: string;
  supportUrl: string;
}

export const DEFAULT_SUPPORT_URL = "https://github.com/sponsors/zzeroneko";

export const DEFAULT_PLUGIN_DATA: UnivVaultPluginData = {
  schemaVersion: 2,
  language: getDefaultLanguage("en"),
  recentLocations: [],
  recentCoursePaths: [],
  lastSemester: getDefaultSemesters()[1],
  supportUrl: DEFAULT_SUPPORT_URL,
};

export interface UnivVaultStore {
  getData(): UnivVaultPluginData;
  updateData(patch: Partial<UnivVaultPluginData>): Promise<void>;
}
