export interface SourceLink {
  id: string;
  name: string;
  url: string;
  description: string;
}

/**
 * Pages where residents can find real local updates. They are shown as pointers
 * only: SAKLAW has not verified them, and no listing is attributed to them
 * unless a real post is entered with its own source URL and verification.
 */
export const SOURCE_LINKS: readonly SourceLink[] = [
  {
    id: "kawit-pio",
    name: "KawitPIO on Facebook",
    url: "https://www.facebook.com/KawitPIO",
    description: "Check this page for current local announcements and advisories.",
  },
  {
    id: "aguinaldo-armie",
    name: "AguinaldoArmie on Facebook",
    url: "https://www.facebook.com/AguinaldoArmie",
    description: "Check this page for current local updates.",
  },
];
