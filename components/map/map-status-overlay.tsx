import { MapPinOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type MapStatus =
  | { state: "loading" }
  | { state: "ready"; has3D: boolean; hasTerrain: boolean }
  | { state: "error"; message: string };

export function MapStatusOverlay({ status }: { status: MapStatus }) {
  if (status.state === "ready") return null;

  if (status.state === "loading") {
    return (
      <div className="absolute inset-0 grid place-items-center bg-muted/60" role="status" aria-live="polite">
        <Skeleton className="size-full" />
        <span className="absolute text-sm text-muted-foreground">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-muted p-6 text-center" role="alert">
      <div className="max-w-xs space-y-2">
        <MapPinOff className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">The map is unavailable</p>
        <p className="text-sm text-muted-foreground">{status.message}</p>
        <p className="text-xs text-muted-foreground">Search and listings still work, and directions open in your maps app.</p>
      </div>
    </div>
  );
}
