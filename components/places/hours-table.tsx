import { describeWeek } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";
import type { Business, WeeklyHours } from "@/types";

const UNCONFIRMED_NOTE: Record<NonNullable<Business["hoursSource"]>, string> = {
  osm: "These hours come from OpenStreetMap and may be out of date.",
  community: "These hours were reported from the place's public page and have not been confirmed.",
};

export function HoursTable({ hours, now, verified, source }: { hours: WeeklyHours; now: Date; verified: boolean; source?: Business["hoursSource"] }) {
  return (
    <div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {describeWeek(hours, now).map((row) => (
          <div key={row.day} className={cn("col-span-2 grid grid-cols-subgrid", row.isToday && "font-semibold")}>
            <dt>{row.day}</dt>
            <dd className="text-right text-muted-foreground">{row.label}</dd>
          </div>
        ))}
      </dl>
      {!verified && (
        <p className="mt-2 text-xs text-muted-foreground">
          {source ? UNCONFIRMED_NOTE[source] : "These hours have not been confirmed."} Call ahead to be sure.
        </p>
      )}
    </div>
  );
}
