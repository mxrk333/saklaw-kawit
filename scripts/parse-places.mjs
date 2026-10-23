/**
 * Parses data/places.md: places added by hand (for example sari-sari stores you
 * know of). One block per place:
 *
 *   # Aling Nena Sari-Sari Store
 *   type: sari-sari store
 *   geo: 14.4458, 120.9052
 *   address: Street, Barangay, Kawit
 *   phone: 0917 000 0000
 *   source: https://maps.app.goo.gl/...   <- where you found it (optional)
 *
 * Indented lines (4 spaces or a tab) and text before the first "# heading" are
 * documentation and are ignored. Anything
 * the parser can't use is reported in `warnings`, never dropped silently.
 */

export const PLACE_CATEGORIES = ["places", "shopping", "food", "health", "stay", "attractions", "schools", "government"];
const KEYS = new Set(["category", "type", "tags", "geo", "address", "barangay", "phone", "website", "source", "note"]);
const GEO = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;

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
