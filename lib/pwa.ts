/** Colours shared by the manifest, the icons and the browser UI theme. */
export const BRAND_GREEN = "#0e6b3f";
export const BACKGROUND = "#fafaf9";

/** iPhone, iPad (including iPadOS, which reports itself as a Mac with touch). */
export function isIosDevice(userAgent: string, maxTouchPoints = 0): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1);
}

/** Only real Safari can add to the home screen on iOS; in-app browsers and Chrome-on-iOS can't prompt. */
export function isIosSafari(userAgent: string, maxTouchPoints = 0): boolean {
  return isIosDevice(userAgent, maxTouchPoints) && /safari/i.test(userAgent) && !/crios|fxios|edgios|instagram|fban|fbav|line\//i.test(userAgent);
}
