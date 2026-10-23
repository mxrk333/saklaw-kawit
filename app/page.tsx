import { connection } from "next/server";
import { ExplorerShell } from "@/components/layout/explorer-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { firstParam, parseCategory } from "@/lib/search/params";

export default async function HomePage(props: PageProps<"/">) {
  // Render per request so the "open now" and expiry logic starts from the real time.
  await connection();
  const params = await props.searchParams;

  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <ExplorerShell
        initialNow={new Date().toISOString()}
        initialQuery={firstParam(params.q) ?? ""}
        initialCategory={parseCategory(params.category)}
        initialSelected={firstParam(params.selected) ?? null}
      />
    </div>
  );
}
