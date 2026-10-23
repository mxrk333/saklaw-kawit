import type { MapLocation } from "@/types";

/** Popup content is built with DOM APIs (textContent) so listing text can never inject HTML. */
export function buildPopupContent(location: MapLocation, onDirections: () => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold leading-snug";
  title.textContent = location.title;

  const meta = document.createElement("p");
  meta.className = "text-xs text-neutral-500";
  meta.textContent = [location.categoryLabel, location.address].filter(Boolean).join(" · ");

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "mt-1 inline-flex h-7 items-center justify-center rounded-md bg-green-700 px-2.5 text-xs font-medium text-white hover:bg-green-800";
  button.textContent = "Get directions";
  button.addEventListener("click", onDirections);

  root.append(title, meta, button);
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
