/**
 * Parses data/places.md: places added by hand (for example sari-sari stores you
 * know of). One block per place:
 *
 *   # Aling Nena Sari-Sari Store
 *   type: sari-sari store
 *   geo: 14.4458, 120.9052
 *   address: Street, Barangay, Kawit
 *   phone: 0917 000 0000
 *   hours: daily 16:00-24:00   <- optional; 24-hour Manila time, drives "Open now"
 *   source: https://maps.app.goo.gl/...   <- where you found it (optional)
 *
 * Indented lines (4 spaces or a tab) and text before the first "# heading" are
 * documentation and are ignored. Anything
 * the parser can't use is reported in `warnings`, never dropped silently.
 */

export const PLACE_CATEGORIES = ["places", "shopping", "food", "health", "stay", "attractions", "schools", "government"];
const KEYS = new Set(["category", "type", "tags", "geo", "address", "barangay", "phone", "website", "source", "note", "hours"]);
const GEO = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIME_RANGE = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*(?:([01]\d|2[0-3]):([0-5]\d)|24:00)$/;

/** "mon-fri" or "sat" or "daily" -> day indexes (0 = Sunday), or null if not understood. */
function parseDays(spec) {
  const text = spec.toLowerCase();
  if (text === "daily") return [0, 1, 2, 3, 4, 5, 6];
  const [from, to = from] = text.split("-").map((d) => DAYS.indexOf(d.slice(0, 3)));
  if (from < 0 || to < 0) return null;
  const days = [];
  for (let day = from; ; day = (day + 1) % 7) {
    days.push(day);
    if (day === to) break;
  }
  return days;
}

/**
 * Parses "daily 16:00-24:00" or "mon-fri 09:00-12:00, 13:00-17:00; sat 10:00-14:00; sun closed".
 * Times are 24-hour Asia/Manila; use 24:00 for midnight. Every day must be covered.
 * @returns {{ hours?: Array<Array<{ open: string, close: string }>>, error?: string }}
 */
export function parseHours(value) {
  const week = Array.from({ length: 7 }, () => null);
  for (const part of value.split(";").map((p) => p.trim()).filter(Boolean)) {
    const match = /^(\S+)\s+(.+)$/.exec(part);
    const days = match ? parseDays(match[1]) : null;
    if (!match || !days) return { error: `could not read the days in "${part}" (use daily, mon, or mon-fri).` };
    const ranges = [];
    if (match[2].trim().toLowerCase() !== "closed") {
      for (const range of match[2].split(",").map((r) => r.trim())) {
        const m = TIME_RANGE.exec(range);
        if (!m) return { error: `could not read the time "${range}" (use 24-hour HH:MM-HH:MM, e.g. 16:00-24:00).` };
        ranges.push({ open: `${m[1]}:${m[2]}`, close: m[3] ? `${m[3]}:${m[4]}` : "24:00" });
      }
    }
    for (const day of days) week[day] = ranges;
  }
  if (week.some((day) => day === null)) return { error: "hours must cover every day of the week (say 'closed' for days off)." };
  return { hours: week };
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * @param {string} markdown
 * @returns {{ places: Array<Record<string, unknown>>, warnings: string[] }}
 */
export function parsePlaces(markdown) {
  const places = [];
  const warnings = [];
  let current = null;

  markdown.split(/\r?\n/).forEach((line, index) => {
    const text = line.trim();
    const where = `Line ${index + 1}`;
    if (!text) return;
    if (/^( {4}|\t)/.test(line)) return; // indented lines are examples in the documentation

    const heading = /^#\s+(.+)$/.exec(text);
    if (heading) {
      const name = heading[1].trim();
      current = { id: slug(name), name, category: "places", tags: [] };
      places.push(current);
      return;
    }
    if (!current) return; // documentation before the first heading

    const pair = /^([a-z]+):\s*(.+)$/i.exec(text);
    if (!pair || !KEYS.has(pair[1].toLowerCase())) {
      warnings.push(`${where}: could not understand "${text}" under "${current.name}".`);
      return;
    }
    const key = pair[1].toLowerCase();
    const value = pair[2].trim();

    if (key === "geo") {
      const match = GEO.exec(value);
      const lat = match ? Number(match[1]) : NaN;
      const lng = match ? Number(match[2]) : NaN;
      if (match && lat >= 4 && lat <= 22 && lng >= 116 && lng <= 128) current.geo = { lat, lng };
      else warnings.push(`${where}: geo "${value}" is not a "lat, lng" inside the Philippines.`);
    } else if (key === "category") {
      if (PLACE_CATEGORIES.includes(value.toLowerCase())) current.category = value.toLowerCase();
      else warnings.push(`${where}: unknown category "${value}". Use one of: ${PLACE_CATEGORIES.join(", ")}.`);
    } else if (key === "tags") {
      current.tags = [...current.tags, ...value.split(",").map((t) => t.trim()).filter(Boolean)];
    } else if (key === "hours") {
      const { hours, error } = parseHours(value);
      if (hours) current.hours = hours;
      else warnings.push(`${where}: hours ${error}`);
    } else if (key === "type") {
      current.type = value;
      current.tags = [...current.tags, value];
    } else {
      current[key] = value;
    }
  });

  const seen = new Set();
  for (const place of places) {
    if (seen.has(place.id)) warnings.push(`"${place.name}" appears more than once.`);
    seen.add(place.id);
    if (!place.geo) warnings.push(`"${place.name}" has no geo line, so it won't appear on the map.`);
  }
  return { places, warnings };
}
