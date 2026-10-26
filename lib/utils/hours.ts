import type { Business, TimeRange, WeeklyHours } from "@/types";

const MANILA_TZ = "Asia/Manila";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

interface ManilaClock {
  day: number;
  minutes: number;
}

export function getManilaClock(now: Date): ManilaClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  return { day, minutes: hour * 60 + Number(get("minute")) };
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isWithin(range: TimeRange, minutes: number): boolean {
  const start = toMinutes(range.open);
  const end = toMinutes(range.close);
  // Ranges that cross midnight (e.g. 18:00-02:00).
  return end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

/**
 * Returns undefined when we cannot honestly say: no hours at all, or hours with
 * no known source. Hours confirmed by us or taken from OpenStreetMap count; the
 * UI labels the latter as possibly out of date.
 */
export function isOpenNow(business: Business, now: Date): boolean | undefined {
  if (!business.hours || !(business.hoursVerified || business.hoursSource)) return undefined;
  const { day, minutes } = getManilaClock(now);
  return business.hours[day].some((range) => isWithin(range, minutes));
}

export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const suffix = h % 24 >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRanges(ranges: readonly TimeRange[]): string {
  if (ranges.length === 0) return "Closed";
  if (ranges.length === 1 && ranges[0].open === "00:00" && ranges[0].close === "24:00") return "Open 24 hours";
  return ranges.map((r) => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(", ");
}

export interface HoursRow {
  day: string;
  label: string;
  isToday: boolean;
}

export function describeWeek(hours: WeeklyHours, now: Date): HoursRow[] {
  const { day: today } = getManilaClock(now);
  return hours.map((ranges, index) => ({
    day: WEEKDAYS[index],
    label: formatRanges(ranges),
    isToday: index === today,
  }));
}

/** Today's hours as one short label (e.g. "4:00 PM – 12:00 AM"), or undefined when no hours are listed. */
export function formatTodayHours(hours: WeeklyHours | undefined, now: Date): string | undefined {
  if (!hours) return undefined;
  return formatRanges(hours[getManilaClock(now).day]);
}
