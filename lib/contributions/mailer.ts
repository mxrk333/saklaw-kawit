import nodemailer from "nodemailer";

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** Address shown as the sender. Providers like Brevo log in with a different id than the sender. */
  from: string;
  to: string;
}

const REQUIRED = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "REPORT_TO_EMAIL"] as const;

/** Names of the required mail settings that are empty, so logs can say exactly what to fill in. */
export function missingMailSettings(env: Readonly<Record<string, string | undefined>> = process.env): string[] {
  return REQUIRED.filter((name) => !env[name]);
}

/** Reads SMTP settings from the environment. Returns null when mail isn't configured. */
export function readMailConfig(env: Readonly<Record<string, string | undefined>> = process.env): MailConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, REPORT_TO_EMAIL } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !REPORT_TO_EMAIL) return null;
  const port = Number(SMTP_PORT ?? 465);
  if (!Number.isInteger(port) || port <= 0) return null;
  return { host: SMTP_HOST, port, user: SMTP_USER, pass: SMTP_PASS, from: SMTP_FROM || SMTP_USER, to: REPORT_TO_EMAIL };
}

export async function sendMail(config: MailConfig, message: { subject: string; text: string }): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.pass },
  });
  await transporter.sendMail({
    from: `SAKLAW Reports <${config.from}>`,
    to: config.to,
    subject: message.subject,
    text: message.text,
  });
}
