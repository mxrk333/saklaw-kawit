import type { Metadata } from "next";
import { AboutSection } from "@/components/about/about-section";
import { CreditsSection } from "@/components/about/credits-section";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "About & disclaimer",
  description: "What SAKLAW is, who built it, and a notice that it is not affiliated with the Municipality of Kawit or any LGU.",
};

const DEVELOPER = { name: "Mark Christian Patigayon", url: "https://github.com/mxrk333" };
const linkClass = "font-medium text-foreground underline underline-offset-2 hover:text-primary";

const SOURCES: ReadonlyArray<{ title: string; text: string }> = [
  { title: "OpenStreetMap", text: "The map and many places come from OpenStreetMap, which anyone can edit." },
  { title: "Added by hand", text: "Some places were added by the SAKLAW team from public pages, and are marked as unconfirmed." },
  { title: "Your reports", text: "Corrections and suggestions you send are read by the developer before anything changes." },
];

const STEPS: ReadonlyArray<{ title: string; text: string }> = [
  { title: "Search or pick a category", text: "Type what you need, such as \u201Ccoffee\u201D, \u201Cbotika\u201D or \u201Cdentist\u201D, or tap a category chip like Coffee & Tea or Shopping." },
  { title: "Narrow it down", text: "Turn on Open now to see places that are open right now, and change the sort order to suit you." },
  { title: "See it on the map", text: "Results appear as pins on the 3D map. Use the map buttons to tilt, recenter, find your location, or switch to satellite view." },
  { title: "Open a place", text: "Tap a pin or a result for its address, phone, hours when known, and how recently it was checked." },
  { title: "Get directions", text: "Choose Drive or Walk for a route on the map, or open the place in Google Maps or Apple Maps." },
  { title: "Help improve it", text: "Spot a mistake or have an idea? Use Report or suggest on the place." },
];

export default function AboutPage() {
  return (
    <PageShell title="About SAKLAW" intro="A free community guide to places, services, and updates in Kawit, Cavite.">
      <AboutSection id="disclaimer" title="Disclaimer" tone="notice">
        <p>
          <strong>SAKLAW is an independent project.</strong> It is not affiliated with, endorsed by, or operated by the Municipality of Kawit,
          Cavite, or any local government unit (LGU), government agency, or official office. It is not an official government website.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Information can be incomplete, out of date, or wrong. Opening hours and details are not guaranteed.</li>
          <li>For official announcements, advisories, permits, and emergencies, contact the Municipality of Kawit or the proper office directly.</li>
          <li>Business names and logos belong to their owners. They are shown only to help you find places.</li>
        </ul>
      </AboutSection>

      <AboutSection id="use" title="How to use SAKLAW">
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </AboutSection>

      <AboutSection id="how" title="Where the information comes from">
        <ul className="space-y-3">
          {SOURCES.map((source) => (
            <li key={source.title}>
              <p className="font-medium text-foreground">{source.title}</p>
              <p>{source.text}</p>
            </li>
          ))}
        </ul>
      </AboutSection>

      <AboutSection id="developer" title="Made by">
        <p>
          Designed and developed by{" "}
          <a href={DEVELOPER.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {DEVELOPER.name}
          </a>
          , as a free resource for the people of Kawit.
        </p>
      </AboutSection>

      <CreditsSection />
    </PageShell>
  );
}
