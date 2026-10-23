"use server";

import { headers } from "next/headers";
import { missingMailSettings, readMailConfig, sendMail } from "@/lib/contributions/mailer";
import { buildReportEmail } from "@/lib/contributions/report-email";
import { reportSchema } from "@/lib/contributions/schemas";
import { listingsRepository } from "@/lib/data/repository";

export type SubmitReportResult = { ok: true } | { ok: false; message: string };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

/** Small in-memory limiter: enough to blunt casual spam of the inbox. */
function allow(client: string, now: number): boolean {
  const hits = (recent.get(client) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(client, hits);
    return false;
  }
  recent.set(client, [...hits, now]);
  return true;
}

export async function submitReportAction(input: unknown, listingTitle: string): Promise<SubmitReportResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your report." };

  const requestHeaders = await headers();
  const client = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(client, Date.now())) return { ok: false, message: "Too many reports. Please try again in a few minutes." };

  const config = readMailConfig();
  if (!config) {
    const missing = missingMailSettings();
    console.error(`[report] Not emailed. ${missing.length ? `Empty in .env.local: ${missing.join(", ")}.` : "SMTP_PORT is not a valid number."}`);
    return { ok: false, message: "Reports can't be sent right now. Please try again later." };
  }

  try {
    await listingsRepository.submitReport(parsed.data);
    await sendMail(config, buildReportEmail(parsed.data, String(listingTitle ?? ""), new Date()));
    return { ok: true };
  } catch (error) {
    console.error("[report] failed to send email", error);
    return { ok: false, message: "We couldn't send your report. Please try again." };
  }
}
