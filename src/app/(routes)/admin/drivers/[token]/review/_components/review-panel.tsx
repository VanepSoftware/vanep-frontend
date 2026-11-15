"use client";

import { useId, useState } from "react";

import { Chip } from "@/components/ui/chip";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import {
  type Fact,
  type FoundSubmission,
  decisionLine,
  registrationChecks,
  submissionFacts,
} from "@/lib/admin/driver-compliance/review";
import { documentStatusTone } from "@/lib/admin/driver-compliance/tone";
import type { DriverComplianceDetail, SubmissionStatusRequest } from "@/lib/admin/driver-compliance/types";
import { submissionStatusUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError, fetchJson } from "@/lib/admin/fetch-json";
import { t } from "@/lib/l10n";

import { RejectForm } from "./reject-form";

const messages = t("admin").driverReview;
const review = messages.review;

/** A decisão foi gravada, ou a API recusou porque o envio mudou e a tela tem de recarregar. */
export type ReviewOutcome = { kind: "decided" } | { kind: "stale"; message: string };

type ReviewPanelProps = {
  detail: DriverComplianceDetail;
  found: FoundSubmission;
  onOutcome: (outcome: ReviewOutcome) => void;
};

/** Os erros que dizem que a tela está velha: outra pessoa decidiu ou o motorista trocou o arquivo. */
function isStale(error: unknown): error is ApiProblemError {
  if (!(error instanceof ApiProblemError)) return false;
  return error.problem.code === "document.review.stale" || error.problem.code === "document.submission.reviewed";
}

export function ReviewPanel({ detail, found, onOutcome }: ReviewPanelProps) {
  const { submission, item } = found;
  const [mode, setMode] = useState<"facts" | "reject">("facts");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealDocument, setRevealDocument] = useState(false);
  const pending = submission.status === "PENDING";
  // A API recusa aprovar sem arquivo (422); a tela já sabe e nem oferece.
  const hasFile = submission.fileUrl != null;
  const blockedId = useId();
  const decided = decisionLine(submission);
  const last = pending && item.lastDecision ? decisionLine(item.lastDecision) : null;

  /** Aprovar e reprovar: o mesmo `PUT`, com a `version` que o admin viu. */
  async function decide(body: SubmissionStatusRequest) {
    setBusy(true);
    setError(null);
    try {
      await fetchJson(submissionStatusUrl(submission.kind, submission.token), {
        method: "PUT",
        body: JSON.stringify(body),
      });
      onOutcome({ kind: "decided" });
    } catch (caught) {
      if (isStale(caught)) {
        onOutcome({ kind: "stale", message: problemMessage(caught.problem) });
      } else {
        setError(caught instanceof ApiProblemError ? problemMessage(caught.problem) : messages.errors.generic);
      }
    } finally {
      setBusy(false);
    }
  }

  if (pending && mode === "reject") {
    return (
      <aside aria-label={review.rejectForm.title} className="flex flex-col rounded-2xl border border-border bg-background">
        <RejectForm
          detail={detail}
          found={found}
          busy={busy}
          error={error}
          onSubmit={(body) => void decide(body)}
          onCancel={() => {
            setError(null);
            setMode("facts");
          }}
        />
      </aside>
    );
  }

  return (
    <aside aria-label={review.facts.title} className="flex flex-col rounded-2xl border border-border bg-background">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-foreground">{review.facts.title}</h2>
          <Chip tone={documentStatusTone(submission.status)}>{messages.documentStatus[submission.status]}</Chip>
        </div>
        <FactList facts={submissionFacts(found, detail.asOf)} />

        <div className="mt-6 rounded-xl bg-background-deep p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">{review.checks.title}</h3>
            {!found.vehicle && detail.driver.document && (
              <button
                type="button"
                onClick={() => setRevealDocument((current) => !current)}
                aria-label={
                  revealDocument
                    ? messages.driver.hideLabel.document
                    : messages.driver.revealLabel.document
                }
                className="text-xs font-semibold text-brand hover:text-brand-strong"
              >
                {revealDocument ? messages.driver.hide : messages.driver.reveal}
              </button>
            )}
          </div>
          <FactList facts={registrationChecks(detail, found, revealDocument)} compact />
        </div>

        {decided && <DecisionBlock title={review.decidedTitle} line={decided} />}
        {last && <DecisionBlock title={review.lastDecisionTitle} line={last} note={review.lastDecisionNote} />}
      </div>

      {pending && (
        <footer className="border-t border-border p-4">
          {error && (
            <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {!hasFile && (
            <p id={blockedId} className="mb-3 text-[13px] text-muted-foreground">
              {messages.errors["document.review.file_required"]}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("reject");
              }}
              disabled={busy}
              className="h-10 rounded-lg border border-danger-border px-5 text-sm font-semibold text-danger hover:border-danger hover:bg-danger-soft disabled:opacity-50"
            >
              {review.reject}
            </button>
            <button
              type="button"
              onClick={() => void decide({ status: "APPROVED", version: submission.version })}
              disabled={busy || !hasFile}
              aria-describedby={hasFile ? undefined : blockedId}
              className="h-10 rounded-lg bg-success px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:brightness-110 disabled:opacity-50"
            >
              {busy ? review.approving : review.approve}
            </button>
          </div>
        </footer>
      )}
    </aside>
  );
}

function FactList({ facts, compact = false }: { facts: Fact[]; compact?: boolean }) {
  return (
    <dl className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 ${compact ? "mt-3 gap-y-2" : "mt-4 gap-y-3"}`}>
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-[13px] text-muted-foreground">{fact.label}</dt>
          <dd className="text-sm font-medium text-foreground">
            {fact.value}
            {fact.hint && <span className="font-normal text-muted-foreground"> · {fact.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DecisionBlock({
  title,
  line,
  note,
}: {
  title: string;
  line: { title: string; reason: string | null };
  note?: string;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground">{line.title}</p>
      {line.reason && <p className="text-sm text-muted-foreground">{line.reason}</p>}
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
