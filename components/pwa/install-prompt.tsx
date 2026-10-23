"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { isIosSafari } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const OPT_OUT_KEY = "saklaw-install-opt-out";

type Environment = "installed" | "opted-out" | "ios" | "other";

/** What kind of browser this is, read once on the client. Strings keep the snapshot stable. */
function readEnvironment(): Environment {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  try {
    if (localStorage.getItem(OPT_OUT_KEY) === "1") return "opted-out";
  } catch {
    // Storage can be blocked (private mode); then we simply ask every time.
  }
  return isIosSafari(navigator.userAgent, navigator.maxTouchPoints) ? "ios" : "other";
}

const subscribeNever = () => () => undefined;

/**
 * Invites people to add SAKLAW to their home screen. It shows on every load or
 * reload (until they install or choose "Don't ask again"), so it is easy to find.
 * Android/Chrome use the browser's install prompt; iPhone Safari has none, so we
 * explain the Share menu steps.
 */
export function InstallPrompt() {
  const environment = useSyncExternalStore(subscribeNever, readEnvironment, () => "installed" as Environment);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // keep the event so we can show our own prompt
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canShow = !closed && environment !== "installed" && environment !== "opted-out" && (installEvent !== null || environment === "ios");
  if (!canShow) return null;

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null); // the browser only allows one prompt per event
    setClosed(true);
  };

  const neverAskAgain = () => {
    try {
      localStorage.setItem(OPT_OUT_KEY, "1");
    } catch {
      // Not stored; it will ask again next time, which is acceptable.
    }
    setClosed(true);
  };

  return (
    <section
      role="dialog"
      aria-label="Add SAKLAW to your home screen"
      className="fade-in slide-in-from-bottom-4 animate-in fill-mode-both fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-50 rounded-2xl border bg-card p-4 shadow-xl [animation-delay:1200ms] lg:inset-x-auto lg:bottom-4 lg:left-4 lg:w-96"
    >
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Not now"
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" aria-hidden />
      </button>
      <h2 className="pr-8 text-sm font-semibold">Add SAKLAW to your home screen</h2>
      <p className="mt-1 text-xs text-muted-foreground">Open it like an app and find places and services in Kawit faster.</p>

      {installEvent ? (
        <div className="mt-3 flex items-center gap-3">
          <Button className="h-10 px-4" onClick={install}>
            Install
          </Button>
          <Button variant="ghost" className="h-10" onClick={() => setClosed(true)}>
            Not now
          </Button>
        </div>
      ) : (
        <ol className="mt-3 space-y-1.5 text-xs">
          <li className="flex items-center gap-1.5">
            1. Tap <Share className="inline size-4 text-primary" aria-label="Share" /> in Safari&apos;s toolbar
          </li>
          <li>2. Scroll and choose &ldquo;Add to Home Screen&rdquo;</li>
          <li>3. Tap &ldquo;Add&rdquo;</li>
        </ol>
      )}

      <button type="button" onClick={neverAskAgain} className="mt-3 text-xs text-muted-foreground underline underline-offset-4">
        Don&apos;t ask again
      </button>
    </section>
  );
}
