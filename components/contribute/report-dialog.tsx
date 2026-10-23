"use client";

import { Flag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS, reportSchema } from "@/lib/contributions/schemas";
import { listingsRepository } from "@/lib/data/repository";

export function ReportDialog({ listingKey, listingTitle }: { listingKey: string; listingTitle: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = reportSchema.safeParse({ listingKey, reason, details });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your report.");
      return;
    }
    setSubmitting(true);
    try {
      await listingsRepository.submitReport(parsed.data);
      toast.success("Thanks — your report was sent to moderators for review.");
      setOpen(false);
      setDetails("");
      setError(null);
    } catch {
      setError("We couldn't send your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag /> Report an issue
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <DialogHeader>
              <DialogTitle>Report inaccurate information</DialogTitle>
              <DialogDescription>
                About &ldquo;{listingTitle}&rdquo;. Reports are reviewed by moderators before anything changes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="report-reason">What&apos;s wrong?</Label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-sm"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="report-details">Details</Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                maxLength={1000}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "report-error" : undefined}
              />
              {error && (
                <p id="report-error" role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
