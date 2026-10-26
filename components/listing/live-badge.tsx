import { Badge } from "@/components/ui/badge";
import { getEventStatus } from "@/lib/utils/events";
import type { CommunityEvent } from "@/types";

/** Real-time state of an event: live now, between nightly sessions, or not started yet. */
export function LiveBadge({ event, now }: { event: CommunityEvent; now: Date }) {
  const status = getEventStatus(event, now);
  if (status === "live") {
    return (
      <Badge className="gap-1.5 bg-rose-600 text-white">
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-white" />
        Happening now
      </Badge>
    );
  }
  if (status === "between") {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">Closed now</Badge>;
  }
  if (status === "upcoming") return <Badge variant="outline">Coming up</Badge>;
  return null;
}
