export type TemplateValues = Record<string, string | number | boolean>;

export function renderTemplate(template: string, values: TemplateValues): string {
  return Object.entries(values).reduce(
    (content, [key, value]) => content.split(`{{${key}}}`).join(String(value)),
    template,
  );
}

export function escapeYaml(value: unknown): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
}

export function currentTimestamp(date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function managedTimestampValues(date = new Date()): { CREATED: string; UPDATED: string } {
  const timestamp = currentTimestamp(date);
  return { CREATED: timestamp, UPDATED: timestamp };
}
