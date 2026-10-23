import { BadgeCheck, CircleHelp, FlaskConical, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VERIFICATION_LABELS, resolveVerification } from "@/lib/utils/verification";
import type { Listing, VerificationStatus } from "@/types";

const STYLES: Record<VerificationStatus, { icon: LucideIcon; className: string }> = {
  official: { icon: BadgeCheck, className: "bg-primary text-primary-foreground" },
  verified: { icon: ShieldCheck, className: "bg-primary/12 text-primary" },
  community: { icon: Users, className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200" },
  unverified: { icon: CircleHelp, className: "bg-muted text-muted-foreground" },
};

export function VerificationBadge({ listing }: { listing: Pick<Listing, "verification" | "source"> }) {
  const status = resolveVerification(listing.verification, listing.source);
  const { icon: Icon, className } = STYLES[status];
  return (
    <Badge className={cn("gap-1", className)}>
      <Icon aria-hidden />
      {VERIFICATION_LABELS[status]}
    </Badge>
  );
}

export function DemoBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 dark:text-amber-300">
      <FlaskConical aria-hidden />
      Demo data
    </Badge>
  );
}
