/**
 * Parses data/rawsources.md into structured source records.
 *
 * Format (one block per barangay):
 *   # Barangay name
 *   https://page-or-website-url
 *   (046) 434 2404          <- optional phone line
 *   geo: 14.4458, 120.9052  <- optional map location (lat, lng) you have confirmed
 *
 * Any other line (e.g. "No Facebook page") is kept as a free-text `note` on that
 * barangay, so nothing in the file is silently dropped.
 */

const URL_PATTERN = /^https?:\/\/\S+$/i;
const GEO_PATTERN = /^geo:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/i;
const PHONE_PATTERN = /(\+?\(?\d[\d\s()-]{6,}\d)/;

/** "balsahan-Bisita" -> "Balsahan-Bisita", "batong dalig" -> "Batong Dalig", "tabon ii" -> "Tabon II" */
export function titleCaseName(raw) {
  return raw
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^[ivx]+$/i.test(part)) return part.toUpperCase(); // Roman numerals: "Tabon II"
      return part.length > 0 && /[a-z]/i.test(part[0]) ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part;
    })
    .join("");
}

/**
 * @param {string} markdown
 * @returns {{ sources: Array<{ id: string, name: string, urls: string[], phone?: string, phoneNote?: string, geo?: { lat: number, lng: number }, notes?: string[] }>, warnings: string[] }}
 */
export function parseRawSources(markdown) {
  const sources = [];
  const warnings = [];
  let current = null;

  markdown.split(/\r?\n/).forEach((line, index) => {
    const text = line.trim();
    if (!text) return;

    const heading = /^#+\s+(.+)$/.exec(text);
    if (heading) {
      const name = titleCaseName(heading[1]);
      current = { id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, urls: [] };
      sources.push(current);
      return;
    }

    if (!current) {
      warnings.push(`Line ${index + 1}: content before the first "# name" heading was ignored.`);
      return;
    }

    const geo = GEO_PATTERN.exec(text);
    if (geo) {
      const lat = Number(geo[1]);
      const lng = Number(geo[2]);
      if (lat >= 4 && lat <= 22 && lng >= 116 && lng <= 128) current.geo = { lat, lng };
      else warnings.push(`Line ${index + 1}: geo "${text}" is outside the Philippines and was ignored.`);
      return;
    }

    if (URL_PATTERN.test(text)) {
      current.urls.push(text);
      return;
    }

    const phone = PHONE_PATTERN.exec(text);
    if (phone && !current.phone) {
      current.phone = phone[1].trim();
      const note = text.replace(phone[1], "").replace(/[:\s]+$/, "").trim();
      if (note) current.phoneNote = note;
      return;
    }

    current.notes = [...(current.notes ?? []), text];
  });

  for (const source of sources) {
    if (source.urls.length === 0 && !source.phone && !source.notes) warnings.push(`"${source.name}" has no URL or phone number.`);
  }
  return { sources, warnings };
}
