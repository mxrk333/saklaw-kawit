import { Badge } from "@/components/ui/badge";
import type { Business } from "@/types";

/** Only claims open/closed when hours are verified; otherwise says so plainly. */
export function OpenStatus({ business, openNow }: { business: Business; openNow: boolean | undefined }) {
  // Unconfirmed hours (from OpenStreetMap) can be stale, so say where they came from.
  const suffix = business.hoursVerified ? "" : business.hoursSource === "community" ? " · reported hours" : " · OSM hours";
  if (openNow === true) {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Open now{suffix}</Badge>;
  }
  if (openNow === false) {
    return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">Closed now{suffix}</Badge>;
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {business.hours ? "Hours unconfirmed" : "Hours not listed"}
    </Badge>
  );
}
