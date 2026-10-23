import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell title="We couldn't find that page" intro="The listing may have been removed or the link may be wrong.">
      <Link href="/" className={buttonVariants()}>
        Back to search
      </Link>
    </PageShell>
  );
}
