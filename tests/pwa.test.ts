import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { isIosDevice, isIosSafari } from "@/lib/pwa";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0 Mobile/15E148 Safari/604.1";
const IPADOS_SAFARI = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36";
const MAC_SAFARI = IPADOS_SAFARI;

describe("iOS detection", () => {
  it("recognises iPhone and iPadOS Safari, which need manual Add to Home Screen steps", () => {
    expect(isIosSafari(IPHONE_SAFARI)).toBe(true);
    expect(isIosSafari(IPADOS_SAFARI, 5)).toBe(true); // iPadOS reports as a Mac with touch
  });

  it("does not treat desktop Safari, Android, or iOS Chrome as installable-by-Safari", () => {
    expect(isIosSafari(MAC_SAFARI, 0)).toBe(false);
    expect(isIosSafari(ANDROID_CHROME)).toBe(false);
    expect(isIosDevice(IPHONE_CHROME)).toBe(true);
    expect(isIosSafari(IPHONE_CHROME)).toBe(false); // Chrome on iOS can't add to the home screen
  });
});

describe("web app manifest", () => {
  const m = manifest();

  it("is installable: standalone display, start URL, name and 192/512 icons", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBe("SAKLAW");
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("includes a maskable icon for Android adaptive icons", () => {
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
  });
});
