import type { CommunityEvent } from "@/types";
import { getManilaClock } from "./hours";

/** live: happening right now. between: inside the run but outside today's hours. */
export type EventStatus = "upcoming" | "live" | "between" | "ended";

function inRanges(event: CommunityEvent, now: Date): boolean {
  if (!event.dailyHours) return true;
  const { day, minutes } = getManilaClock(now);
  return event.dailyHours[day].some((range) => {
    const [oh, om] = range.open.split(":").map(Number);
    const [ch, cm] = range.close.split(":").map(Number);
    const start = oh * 60 + om;
    const end = ch * 60 + cm;
    return end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  });
}

/** Where an event is right now, using Asia/Manila time for its daily hours. */
export function getEventStatus(event: CommunityEvent, now: Date): EventStatus {
  const time = now.getTime();
  if (time < new Date(event.startsAt).getTime()) return "upcoming";
  if (event.endsAt && time >= new Date(event.endsAt).getTime()) return "ended";
  return inRanges(event, now) ? "live" : "between";
}

export const isEventLive = (event: CommunityEvent, now: Date): boolean => getEventStatus(event, now) === "live";
