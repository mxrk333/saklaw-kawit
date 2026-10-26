import type { MapLocation } from "@/types";

/** Popup content is built with DOM APIs (textContent) so listing text can never inject HTML. */
export function buildPopupContent(location: MapLocation, onDirections: () => void, liveEvent?: MapLocation): HTMLElement {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-1";

  if (liveEvent) {
    const banner = document.createElement("p");
    banner.className =
      "mb-0.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white";
    const dot = document.createElement("span");
    dot.className = "size-1.5 animate-pulse rounded-full bg-white";
    dot.setAttribute("aria-hidden", "true");
    banner.append(dot, document.createTextNode(`HAPPENING NOW${/christmas/i.test(liveEvent.title) ? " · 🎄 Christmas" : ""}`));
    const event = document.createElement("p");
    event.className = "text-xs font-medium text-rose-700";
    event.textContent = liveEvent.title;
    root.append(banner, event);
  }

  const title = document.createElement("p");
  title.className = "text-sm font-semibold leading-snug";
  title.textContent = location.title;

  const meta = document.createElement("p");
  meta.className = "text-xs text-neutral-500";
  meta.textContent = [location.categoryLabel, location.address].filter(Boolean).join(" · ");

  root.append(title, meta);
  if (location.precision === "area") {
    const note = document.createElement("p");
    note.className = "text-xs text-neutral-500";
    note.textContent = "Barangay area (not an exact address)";
    root.append(note);
    return root;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `mt-1 inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-medium text-white ${
    liveEvent ? "bg-rose-600 hover:bg-rose-700" : "bg-green-700 hover:bg-green-800"
  }`;
  button.textContent = "Get directions";
  button.addEventListener("click", onDirections);

  root.append(button);
  return root;
}

export function createOriginElement(kind: "device" | "manual"): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", kind === "device" ? "Your location" : "Chosen starting point");
  el.className =
    kind === "device"
      ? "size-4 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.25)]"
      : "size-4 rounded-sm border-2 border-white bg-neutral-800 shadow-md";
  return el;
}
