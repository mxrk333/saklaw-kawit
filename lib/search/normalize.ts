/**
 * Lowercases, strips accents and turns "S&R" into "snr" (what people type) in
 * both the data and the query. Other "A&B" names are joined into one word.
 * "S&R" must not become "sr", which would collide with the abbreviation "Sr.".
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\bs\s*&\s*r\b/g, "snr")
    .replace(/(\p{L})&(\p{L})/gu, "$1$2");
}
