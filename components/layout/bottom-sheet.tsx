"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "half" | "full";

/** Height of the collapsed sheet: drag handle plus one summary line. */
export const SHEET_PEEK_PX = 88;
/** Space left above the full sheet so the search overlay stays reachable. */
const FULL_TOP_GAP_PX = 128;
const DRAG_THRESHOLD_PX = 6;
const ORDER: readonly SheetSnap[] = ["peek", "half", "full"];
const SNAP_CSS: Record<SheetSnap, string> = {
  peek: `${SHEET_PEEK_PX}px`,
  half: "50%",
  full: `calc(100% - ${FULL_TOP_GAP_PX}px)`,
};

interface BottomSheetProps {
  label: string;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Always visible, even when the sheet is collapsed. */
  summary: ReactNode;
  children: ReactNode;
}

function snapHeights(containerHeight: number): Record<SheetSnap, number> {
  return {
    peek: SHEET_PEEK_PX,
    half: Math.round(containerHeight * 0.5),
    full: Math.max(SHEET_PEEK_PX, containerHeight - FULL_TOP_GAP_PX),
  };
}

/**
 * Bottom sheet for phones. Drag the handle to resize it, or tap it to step
 * through peek / half / full. Anchored to the bottom of a relative parent.
 */
export function BottomSheet({ label, snap, onSnapChange, summary, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const containerHeight = () => sheetRef.current?.parentElement?.clientHeight ?? 0;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startHeight: sheetRef.current?.offsetHeight ?? 0, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const delta = state.startY - event.clientY;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) state.moved = true;
    if (!state.moved) return;
    const heights = snapHeights(containerHeight());
    setDragHeight(Math.min(heights.full, Math.max(heights.peek, state.startHeight + delta)));
  };

  const onPointerUp = () => {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    if (!state.moved) {
      onSnapChange(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length]);
      return;
    }
    const heights = snapHeights(containerHeight());
    const final = dragHeight ?? state.startHeight;
    const nearest = ORDER.reduce((best, candidate) =>
      Math.abs(heights[candidate] - final) < Math.abs(heights[best] - final) ? candidate : best,
    );
    setDragHeight(null);
    onSnapChange(nearest);
  };

  return (
    <section
      ref={sheetRef}
      aria-label={label}
      style={{ height: dragHeight ?? SNAP_CSS[snap] }}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t bg-card shadow-[0_-8px_24px_rgba(0,0,0,0.14)]",
        dragHeight === null && "transition-[height] duration-200 ease-out",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Resize panel (currently ${snap})`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSnapChange(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length]);
          }
        }}
        className="shrink-0 cursor-grab touch-none px-4 pt-2 pb-2 select-none active:cursor-grabbing"
      >
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-muted-foreground/30" aria-hidden />
        <div className="text-sm font-medium">{summary}</div>
      </div>
      <div
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]", snap === "peek" && dragHeight === null && "invisible")}
      >
        {children}
      </div>
    </section>
  );
}
