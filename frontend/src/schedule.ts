import type { ScheduleDay, ScheduleItem, ScheduleTimeRange } from "./types";
import { SCHEDULE_DAYS } from "./types";

export interface BlockDraft {
  index: number | null;
  from: string;
  to: string;
  hvac_mode: string;
  temperature: string;
  target_temp_low: string;
  target_temp_high: string;
  fan_mode: string;
  humidity: string;
}

export const DAY_LABELS: Record<ScheduleDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function todayDay(now: Date = new Date()): ScheduleDay {
  return SCHEDULE_DAYS[(now.getDay() + 6) % 7];
}

export function emptyDraft(): BlockDraft {
  return {
    index: null,
    from: "07:00",
    to: "22:00",
    hvac_mode: "",
    temperature: "",
    target_temp_low: "",
    target_temp_high: "",
    fan_mode: "",
    humidity: "",
  };
}

export function shortTime(value: string): string {
  return value.slice(0, 5);
}

/** Return minutes since midnight, treating a trailing midnight as end of day. */
export function toMinutes(value: string, isEnd = false): number {
  const [hours, minutes] = shortTime(value).split(":").map(Number);
  const total = hours * 60 + minutes;
  return isEnd && total === 0 ? 24 * 60 : total;
}

export function toStorageTime(value: string, isEnd = false): string {
  return isEnd && toMinutes(value, true) === 24 * 60
    ? "24:00:00"
    : `${shortTime(value)}:00`;
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function draftToTimeRange(draft: BlockDraft): ScheduleTimeRange {
  const data: Record<string, string | number> = {};
  if (draft.hvac_mode) data.hvac_mode = draft.hvac_mode;
  if (draft.fan_mode) data.fan_mode = draft.fan_mode;

  const temperature = parseNumber(draft.temperature);
  if (temperature !== undefined) data.temperature = temperature;

  const low = parseNumber(draft.target_temp_low);
  const high = parseNumber(draft.target_temp_high);
  if (low !== undefined) data.target_temp_low = low;
  if (high !== undefined) data.target_temp_high = high;

  const humidity = parseNumber(draft.humidity);
  if (humidity !== undefined) data.humidity = humidity;

  const range: ScheduleTimeRange = {
    from: toStorageTime(draft.from),
    to: toStorageTime(draft.to, true),
  };
  if (Object.keys(data).length > 0) range.data = data;
  return range;
}

export function timeRangeToDraft(
  range: ScheduleTimeRange,
  index: number,
): BlockDraft {
  const data = range.data ?? {};
  const text = (key: string): string =>
    data[key] === undefined ? "" : String(data[key]);
  return {
    index,
    from: shortTime(range.from),
    to: shortTime(range.to) === "24:00" ? "00:00" : shortTime(range.to),
    hvac_mode: text("hvac_mode"),
    temperature: text("temperature"),
    target_temp_low: text("target_temp_low"),
    target_temp_high: text("target_temp_high"),
    fan_mode: text("fan_mode"),
    humidity: text("humidity"),
  };
}

export function validateDraft(
  draft: BlockDraft,
  blocks: ScheduleTimeRange[],
): string | null {
  if (!draft.from || !draft.to) return "Set a start and end time";

  const start = toMinutes(draft.from);
  const end = toMinutes(draft.to, true);
  if (end <= start) return "The end time must be after the start time";

  const low = parseNumber(draft.target_temp_low);
  const high = parseNumber(draft.target_temp_high);
  if ((low === undefined) !== (high === undefined)) {
    return "A temperature range needs both a low and a high value";
  }
  if (low !== undefined && high !== undefined && low >= high) {
    return "The low temperature must be below the high temperature";
  }
  if (parseNumber(draft.temperature) !== undefined && low !== undefined) {
    return "Set either a target temperature or a temperature range";
  }

  const overlaps = blocks.some((block, index) => {
    if (index === draft.index) return false;
    return (
      start < toMinutes(block.to, true) && end > toMinutes(block.from)
    );
  });
  return overlaps ? "This block overlaps another block on the same day" : null;
}

export function sortBlocks(blocks: ScheduleTimeRange[]): ScheduleTimeRange[] {
  return [...blocks].sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
}

export function withDayBlocks(
  schedule: ScheduleItem,
  day: ScheduleDay,
  blocks: ScheduleTimeRange[],
): ScheduleItem {
  return { ...schedule, [day]: sortBlocks(blocks) };
}

/** Build the full replace payload required by the schedule websocket API. */
export function buildUpdateMessage(
  schedule: ScheduleItem,
): Record<string, unknown> {
  const message: Record<string, unknown> = {
    type: "schedule/update",
    schedule_id: schedule.id,
    name: schedule.name,
  };
  if (schedule.icon) message.icon = schedule.icon;
  for (const day of SCHEDULE_DAYS) {
    message[day] = sortBlocks(schedule[day] ?? []);
  }
  return message;
}

export function describeBlock(range: ScheduleTimeRange): string {
  const data = range.data ?? {};
  const parts: string[] = [];
  if (data.hvac_mode !== undefined) {
    parts.push(String(data.hvac_mode).replaceAll("_", " "));
  }
  if (data.temperature !== undefined) parts.push(`${data.temperature}°`);
  if (data.target_temp_low !== undefined && data.target_temp_high !== undefined) {
    parts.push(`${data.target_temp_low}° – ${data.target_temp_high}°`);
  }
  if (data.fan_mode !== undefined) parts.push(`fan ${data.fan_mode}`);
  if (data.humidity !== undefined) parts.push(`${data.humidity}%`);
  return parts.length > 0 ? parts.join(" · ") : "No changes";
}

export function blocksFromLegacy(
  legacy: { on_time: string; off_time: string } | null | undefined,
): ScheduleTimeRange[] {
  const from = legacy?.on_time ? shortTime(legacy.on_time) : "07:00";
  const to = legacy?.off_time ? shortTime(legacy.off_time) : "22:00";
  if (toMinutes(to, true) <= toMinutes(from)) return [];
  return [{ from: `${from}:00`, to: toStorageTime(to, true) }];
}
