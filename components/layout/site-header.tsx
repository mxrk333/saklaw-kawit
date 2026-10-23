import { MapPinned } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV: ReadonlyArray<{ href: string; label: string; hideOnMobile?: boolean }> = [
  { href: "/", label: "Explore", hideOnMobile: true },
  { href: "/places", label: "Places" },
  { href: "/announcements", label: "Updates" },
  { href: "/events", label: "Events" },
];

export function SiteHeader() {
  return (
    <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b bg-card px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <MapPinned className="size-4" aria-hidden />
        </span>
        SAKLAW
        <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Kawit, Cavite</span>
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={cn("rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:px-2.5", item.hideOnMobile && "hidden sm:block")}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
