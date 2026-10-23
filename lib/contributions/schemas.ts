import { z } from "zod";

export const REPORT_REASONS = [
  { value: "wrong-info", label: "Information is incorrect" },
  { value: "closed", label: "Permanently closed or moved" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "inappropriate", label: "Inappropriate or misleading" },
  { value: "other", label: "Something else" },
] as const;

export const reportSchema = z.object({
  listingKey: z.string().min(1),
  reason: z.enum(["wrong-info", "closed", "duplicate", "inappropriate", "other"]),
  details: z
    .string()
    .trim()
    .min(10, "Please add at least 10 characters so moderators can act on it.")
    .max(1000, "Please keep details under 1,000 characters."),
});

export type ReportInput = z.infer<typeof reportSchema>;

export interface ReportRecord extends ReportInput {
  id: string;
  createdAt: string;
  /** All reports start as pending until a moderator reviews them. */
  status: "pending";
}
