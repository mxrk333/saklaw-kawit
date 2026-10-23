import { ChevronDown } from "lucide-react";
import { DATA_CREDITS, SOFTWARE_CREDITS, TRADEMARK_NOTICE, type Credit } from "@/data/credits";
import { AboutSection } from "./about-section";

const linkClass = "font-medium text-foreground underline underline-offset-2 hover:text-primary";

function CreditRow({ credit }: { credit: Credit }) {
  return (
    <li className="space-y-0.5 py-3 first:pt-0 last:pb-0">
      <a href={credit.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {credit.name}
      </a>
      <p className="text-sm text-muted-foreground">
        {credit.use}. By {credit.by}.
      </p>
      <p className="text-xs text-muted-foreground">
        Licence:{" "}
        {credit.licenseUrl ? (
          <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {credit.license}
          </a>
        ) : (
          credit.license
        )}
      </p>
    </li>
  );
}

function CreditGroup({ title, credits }: { title: string; credits: readonly (Credit & { key: string })[] }) {
  return (
    <details className="group rounded-xl border bg-background">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
        <span>
          {title} <span className="font-normal text-muted-foreground">({credits.length})</span>
        </span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="divide-y border-t px-4 py-3">
        {credits.map(({ key, ...credit }) => (
          <CreditRow key={key} credit={credit} />
        ))}
      </ul>
    </details>
  );
}

/** Credits and licences for the data, services and open-source software SAKLAW is built on. */
export function CreditsSection() {
  return (
    <AboutSection id="credits" title="Credits and licences">
      <p>
        SAKLAW is built on the free work of many people. Thank you to everyone listed here. Tap a group to see who made what. The full licence texts
        are in <code className="rounded bg-muted px-1 py-0.5 text-sm">THIRD_PARTY_NOTICES.md</code> in the project repository.
      </p>
      <div className="space-y-2">
        <CreditGroup title="Maps, data and fonts" credits={DATA_CREDITS.map((c) => ({ ...c, key: c.name }))} />
        <CreditGroup title="Open-source software" credits={SOFTWARE_CREDITS.map((c) => ({ ...c, key: c.pkg }))} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{TRADEMARK_NOTICE}</p>
    </AboutSection>
  );
}
