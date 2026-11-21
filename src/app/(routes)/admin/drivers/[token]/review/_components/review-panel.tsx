"use client";

import { useId, useState } from "react";

import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApproveIcon, EditIcon, RejectIcon } from "@/components/ui/decision-icons";
import type { ApiProblem } from "@/lib/admin/api-problem";
import { formatDateTime } from "@/lib/admin/driver-compliance/format";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import {
  type Fact,
  type FoundSubmission,
  canCorrectData,
  correctionLine,
  decisionLine,
  registrationChecks,
  submissionFacts,
  submissionInSentence,
} from "@/lib/admin/driver-compliance/review";
import {
  type DataField,
  type DataValues,
  type FieldErrors,
  dataBody,
  dataFields,
  dataValues,
  firstErrorField,
  problemFieldErrors,
  validateData,
} from "@/lib/admin/driver-compliance/submission-data";
import { documentStatusTone } from "@/lib/admin/driver-compliance/tone";
import type {
  DocumentRejectionReason,
  DriverComplianceDetail,
  SubmissionDataRequest,
  SubmissionStatusRequest,
} from "@/lib/admin/driver-compliance/types";
import { submissionDataUrl, submissionStatusUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError, fetchJson } from "@/lib/admin/fetch-json";
import { interpolate, t } from "@/lib/l10n";

import { DataFields, fieldId } from "./data-fields";
import { RejectForm } from "./reject-form";

const messages = t("admin").driverReview;
const review = messages.review;
const data = review.data;

/**
 * A decisão foi gravada, os dados foram corrigidos, ou a API recusou porque o
 * envio mudou e a tela tem de recarregar.
 */
export type ReviewOutcome = { kind: "decided" } | { kind: "corrected" } | { kind: "stale"; message: string };

type ReviewPanelProps = {
  detail: DriverComplianceDetail;
  found: FoundSubmission;
  onOutcome: (outcome: ReviewOutcome) => void;
};

/**
 * Os erros que dizem que a tela está velha: outra pessoa decidiu ou corrigiu,
 * o motorista trocou o arquivo, ou o envio deixou de ser o aprovado.
 */
const STALE_CODES = new Set(["document.review.stale", "document.submission.reviewed", "document.data.not_approved"]);

type Mode = "data" | "reject" | "correct";

export function ReviewPanel({ detail, found, onOutcome }: ReviewPanelProps) {
  const { submission, item } = found;
  const pending = submission.status === "PENDING";
  const fields = dataFields(submission.kind, item.requirement);
  const idPrefix = useId();

  const [mode, setMode] = useState<Mode>("data");
  const [rejectCode, setRejectCode] = useState<DocumentRejectionReason | null>(null);
  const [values, setValues] = useState<DataValues>(() => dataValues(submission));
  /** Depois da primeira tentativa, os erros da tela aparecem e se atualizam a cada tecla. */
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealDocument, setRevealDocument] = useState(false);
  /** A decisão esperando o "tem certeza?": aprovar com os dados, ou reprovar com o motivo. */
  const [confirming, setConfirming] = useState<SubmissionStatusRequest | null>(null);

  const correcting = mode === "correct";
  const clientErrors = attempted ? validateData(fields, values, detail.asOf, { allowPast: correcting }) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  function focusField(field: DataField | null) {
    if (field) document.getElementById(fieldId(idPrefix, field))?.focus();
  }

  function changeValue(field: DataField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function openReject(code: DocumentRejectionReason | null) {
    setError(null);
    setRejectCode(code);
    setMode("reject");
  }

  function resetForm(next: Mode) {
    setValues(dataValues(submission));
    setAttempted(false);
    setServerErrors({});
    setError(null);
    setMode(next);
  }

  /** Confere o que a tela já sabe; com erro, leva o foco ao primeiro campo marcado. */
  function readyBody(): ReturnType<typeof dataBody> | null {
    setAttempted(true);
    setError(null);
    const invalid = validateData(fields, values, detail.asOf, { allowPast: correcting });
    const first = firstErrorField(fields, invalid);
    if (first) {
      setError(data.checkFields);
      focusField(first);
      return null;
    }
    return dataBody(fields, values);
  }

  function handleProblem(problem: ApiProblem) {
    if (problem.code && STALE_CODES.has(problem.code)) {
      onOutcome({ kind: "stale", message: problemMessage(problem) });
      return;
    }
    const fieldErrors = problemFieldErrors(problem, fields);
    const first = firstErrorField(fields, fieldErrors);
    if (first) {
      setServerErrors(fieldErrors);
      setError(data.checkFields);
      focusField(first);
    } else {
      setError(problemMessage(problem));
    }
  }

  /** Aprovar, reprovar e corrigir: um `PUT` com a `version` que o admin viu. */
  async function send(url: string, body: SubmissionStatusRequest | SubmissionDataRequest, done: ReviewOutcome) {
    setBusy(true);
    setError(null);
    try {
      await fetchJson(url, { method: "PUT", body: JSON.stringify(body) });
      onOutcome(done);
    } catch (caught) {
      if (caught instanceof ApiProblemError) handleProblem(caught.problem);
      else setError(messages.errors.generic);
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  function requestApprove(event: React.FormEvent) {
    event.preventDefault();
    const body = readyBody();
    if (body) setConfirming({ status: "APPROVED", version: submission.version, ...body });
  }

  function saveCorrection(event: React.FormEvent) {
    event.preventDefault();
    const body = readyBody();
    if (!body) return;
    void send(submissionDataUrl(submission.kind, submission.token), { version: submission.version, ...body }, {
      kind: "corrected",
    });
  }

  const documentName = submissionInSentence(detail, found);
  const rejecting = confirming?.status === "REJECTED";
  const confirmText = rejecting ? review.confirmReject : review.confirmApprove;
  const confirmDialog = (
    <ConfirmDialog
      open={confirming != null}
      busy={busy}
      tone={rejecting ? "danger" : "success"}
      icon={rejecting ? <RejectIcon /> : <ApproveIcon />}
      title={interpolate(confirmText.title, { document: documentName })}
      description={confirmText.description}
      confirmLabel={confirmText.confirm}
      onConfirm={() =>
        confirming && void send(submissionStatusUrl(submission.kind, submission.token), confirming, { kind: "decided" })
      }
      onCancel={() => setConfirming(null)}
    />
  );

  if (pending && mode === "reject") {
    return (
      <aside aria-label={review.rejectForm.title} className={PANEL}>
        <RejectForm
          detail={detail}
          found={found}
          initialCode={rejectCode}
          busy={busy}
          error={error}
          onSubmit={(body) => {
            setError(null);
            setConfirming(body);
          }}
          onCancel={() => {
            setError(null);
            setMode("data");
          }}
        />
        {confirmDialog}
      </aside>
    );
  }

  const checks = (
    <div className="mt-6 rounded-xl bg-background-deep p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{review.checks.title}</h3>
        {!found.vehicle && detail.driver.document && (
          <button
            type="button"
            onClick={() => setRevealDocument((current) => !current)}
            aria-label={revealDocument ? messages.driver.hideLabel.document : messages.driver.revealLabel.document}
            className="text-xs font-semibold text-brand hover:text-brand-strong"
          >
            {revealDocument ? messages.driver.hide : messages.driver.reveal}
          </button>
        )}
      </div>
      <FactList facts={registrationChecks(detail, found, revealDocument)} compact />
    </div>
  );
  const last = pending && item.lastDecision ? decisionLine(item.lastDecision) : null;
  const errorBox = error && (
    <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      {error}
    </p>
  );
  const formFields = (
    <DataFields
      idPrefix={idPrefix}
      fields={fields}
      values={values}
      errors={errors}
      today={detail.asOf}
      disabled={busy}
      onChange={changeValue}
      onRejectAs={pending ? openReject : undefined}
    />
  );

  // Pendente: o admin lê o arquivo, preenche os dados e decide.
  if (pending) {
    return (
      <aside aria-label={review.facts.title} className={PANEL}>
        <form noValidate onSubmit={requestApprove} className="flex flex-1 flex-col">
          <div className="flex-1 p-6">
            <PanelTitle title={review.facts.title} status={submission.status} />
            <p className="mt-1 text-[13px] text-muted-foreground">
              {data.fillHint}{" "}
              {interpolate(review.sentBy, { at: formatDateTime(submission.createdAt) })}
            </p>
            {formFields}
            {checks}
            {last && (
              <DecisionBlock
                title={review.lastDecisionTitle}
                line={last}
                note={item.lastDecision?.supersededAt ? review.lastDecisionNote : undefined}
              />
            )}
          </div>

          <footer className="border-t border-border p-4">
            {errorBox}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openReject(null)}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-danger-border px-5 text-sm font-semibold text-danger hover:border-danger hover:bg-danger-soft disabled:opacity-50"
              >
                <RejectIcon />
                {review.reject}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-success px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:brightness-110 disabled:opacity-50"
              >
                {!busy && <ApproveIcon />}
                {busy ? review.approving : review.approve}
              </button>
            </div>
          </footer>
        </form>
        {confirmDialog}
      </aside>
    );
  }

  // Aprovado: corrigir um erro de digitação, sem mexer na decisão nem no arquivo.
  if (correcting) {
    return (
      <aside aria-label={data.correctTitle} className={PANEL}>
        <form noValidate onSubmit={saveCorrection} className="flex flex-1 flex-col">
          <div className="flex-1 p-6">
            <PanelTitle title={data.correctTitle} status={submission.status} />
            <p className="mt-1 text-[13px] text-muted-foreground">{data.correctHint}</p>
            {formFields}
            {checks}
          </div>
          <footer className="border-t border-border p-4">
            {errorBox}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => resetForm("data")}
                disabled={busy}
                className="h-10 rounded-lg border border-border px-4 text-sm text-foreground hover:border-border-strong hover:bg-muted disabled:opacity-50"
              >
                {data.cancel}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm hover:brightness-110 disabled:opacity-50"
              >
                {busy ? data.saving : data.save}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    );
  }

  // Decidido: o que o admin leu do arquivo e quem decidiu.
  const decided = decisionLine(submission);
  const corrected = correctionLine(submission);
  return (
    <aside aria-label={review.facts.title} className={PANEL}>
      <div className="flex-1 p-6">
        <PanelTitle title={review.facts.title} status={submission.status} />
        <FactList facts={submissionFacts(found, detail.asOf)} />
        {corrected && <p className="mt-3 text-xs text-muted-foreground">{corrected}</p>}
        {checks}
        {decided && <DecisionBlock title={review.decidedTitle} line={decided} />}
      </div>
      {canCorrectData(submission) && (
        <footer className="border-t border-border p-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => resetForm("correct")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:border-border-strong hover:bg-muted"
            >
              <EditIcon />
              {data.correct}
            </button>
          </div>
        </footer>
      )}
    </aside>
  );
}

const PANEL = "flex flex-col rounded-2xl border border-border bg-background";

function PanelTitle({ title, status }: { title: string; status: FoundSubmission["submission"]["status"] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      <Chip tone={documentStatusTone(status)}>{messages.documentStatus[status]}</Chip>
    </div>
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
