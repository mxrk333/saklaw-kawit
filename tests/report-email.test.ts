import { describe, expect, it } from "vitest";
import { missingMailSettings, readMailConfig } from "@/lib/contributions/mailer";
import { buildReportEmail } from "@/lib/contributions/report-email";

const report = { listingKey: "business:place-che", reason: "suggestion", details: "Please add opening hours." } as const;

describe("buildReportEmail", () => {
  it("puts the reason and listing in the subject and the details in the body", () => {
    const email = buildReportEmail(report, "Che Sari-Sari Store", new Date("2026-10-23T00:00:00Z"));
    expect(email.subject).toBe("[SAKLAW] Suggestion or concern: Che Sari-Sari Store");
    expect(email.text).toContain("Please add opening hours.");
    expect(email.text).toContain("business:place-che");
  });

  it("cannot be used to inject extra email headers through the title", () => {
    const email = buildReportEmail(report, "Shop\r\nBcc: spam@example.com", new Date());
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});

describe("readMailConfig", () => {
  const env = { SMTP_HOST: "smtp.gmail.com", SMTP_USER: "a@b.c", SMTP_PASS: "x", REPORT_TO_EMAIL: "me@b.c" };
  it("defaults to port 465 when everything else is set", () => {
    expect(readMailConfig(env)?.port).toBe(465);
  });
  it("sends from SMTP_FROM when given, otherwise from the login", () => {
    expect(readMailConfig(env)?.from).toBe("a@b.c");
    expect(readMailConfig({ ...env, SMTP_FROM: "noreply@b.c" })?.from).toBe("noreply@b.c");
  });
  it("returns null when anything is missing", () => {
    expect(readMailConfig({ ...env, SMTP_PASS: undefined })).toBeNull();
  });
});

describe("missingMailSettings", () => {
  it("names the empty settings", () => {
    expect(missingMailSettings({ SMTP_HOST: "h", SMTP_USER: "u", SMTP_PASS: "", REPORT_TO_EMAIL: "t" })).toEqual(["SMTP_PASS"]);
  });
});
