"use client";

import { useId, useState } from "react";

import { rejectionMessageError } from "@/lib/admin/driver-compliance/decision";
import { driverRejectionPreview } from "@/lib/admin/driver-compliance/messages";
import {
  DOCUMENT_REJECTION_REASONS,
  type FoundSubmission,
  rejectionConsequence,
  rejectionPreviewSubject,
} from "@/lib/admin/driver-compliance/review";
import type {
  DocumentRejectionReason,
  DriverComplianceDetail,
  SubmissionStatusRequest,
} from "@/lib/admin/driver-compliance/types";
import { t } from "@/lib/l10n";

import { ReasonFields } from "../../../_components/reason-fields";

const messages = t("admin").driverReview;
const form = messages.review.rejectForm;

type RejectFormProps = {
  detail: DriverComplianceDetail;
  found: FoundSubmission;
  busy: boolean;
  error: string | null;
  onSubmit: (body: SubmissionStatusRequest) => void;
  onCancel: () => void;
};

/**
 * Reprovar um envio: o motivo estruturado, a mensagem (obrigatória só em
 * "Outro motivo") e a prévia do que o motorista lê no e-mail, com os mesmos
 * textos da API (`document.rejection_reason.*`).
 */
export function RejectForm({ detail, found, busy, error, onSubmit, onCancel }: RejectFormProps) {
  const titleId = useId();
  const [code, setCode] = useState<DocumentRejectionReason | null>(null);
  const [message, setMessage] = useState("");
  const invalid = rejectionMessageError(code, message);
  const consequence = rejectionConsequence(detail, found);
  const preview = code ? driverRejectionPreview(code, message) : [];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid || !code) return;
    const note = message.trim();
    onSubmit({
      status: "REJECTED",
      version: found.submission.version,
      rejectionReasonCode: code,
      ...(note ? { rejectionReason: note } : {}),
    });
  }

  return (
    <form onSubmit={submit} aria-labelledby={titleId} className="flex flex-1 flex-col">
      <div className="flex-1 p-6">
        <h2 id={titleId} className="font-display text-base font-bold text-foreground">
          {form.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {form.description}
          {consequence && ` ${consequence}`}
        </p>

        <ReasonFields
          codes={DOCUMENT_REJECTION_REASONS}
          labels={messages.documentRejectionOption}
          code={code}
          onCode={setCode}
          message={message}
          onMessage={setMessage}
          requiredWith="OTHER"
          disabled={busy}
        />

        {code && (
          <div aria-live="polite" className="mt-2 rounded-xl border border-border bg-background-deep p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {form.previewTitle}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{rejectionPreviewSubject(found)}</p>
            {preview.length > 0 ? (
              preview.map((paragraph, index) => (
                <p key={index} className="mt-1 whitespace-pre-line text-sm text-foreground">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="mt-1 text-sm italic text-muted-foreground">{form.previewEmpty}</p>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-border p-4">
        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-lg border border-border px-4 text-sm text-foreground hover:border-border-strong hover:bg-muted disabled:opacity-50"
          >
            {form.cancel}
          </button>
          <button
            type="submit"
            disabled={busy || invalid != null}
            className="h-10 rounded-lg bg-danger px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {busy ? form.rejecting : form.confirm}
          </button>
        </div>
      </footer>
    </form>
  );
}
