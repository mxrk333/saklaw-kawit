import { REPORT_REASONS, type ReportInput } from "./schemas";

const oneLine = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max);

/** Plain-text email for a report. Text only, so nothing a visitor types is ever rendered as HTML. */
export function buildReportEmail(report: ReportInput, listingTitle: string, sentAt: Date) {
  const reason = REPORT_REASONS.find((r) => r.value === report.reason)?.label ?? report.reason;
  const title = oneLine(listingTitle, 120) || "Unknown listing";
  return {
    subject: `[SAKLAW] ${reason}: ${title}`,
    text: [
      `Reason: ${reason}`,
      `Listing: ${title}`,
      `Listing key: ${report.listingKey}`,
      `Received: ${sentAt.toISOString()}`,
      "",
      report.details,
    ].join("\n"),
  };
}
