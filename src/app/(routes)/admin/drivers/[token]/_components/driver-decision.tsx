"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import {
  DRIVER_REJECTION_REASONS,
  blockersSummary,
  canDecideRegistration,
  rejectionMessageError,
} from "@/lib/admin/driver-compliance/decision";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import type {
  Blocker,
  DriverComplianceDetail,
  DriverRejectionReason,
  DriverRejectionRequest,
} from "@/lib/admin/driver-compliance/types";
import { ApiProblemError, fetchJson } from "@/lib/admin/fetch-json";
import { interpolate, t } from "@/lib/l10n";

import { ReasonFields } from "../../_components/reason-fields";

const messages = t("admin").driverReview;
const decision = messages.decision;
const common = t("common");

export type DecisionOutcome =
  | { kind: "approved" }
  | { kind: "rejected" }
  /** A API recusou: a tela recarrega e mostra o motivo (e os bloqueios que ela mandou). */
  | { kind: "refused"; message: string; blockers: Blocker[] };

type DriverDecisionProps = {
  detail: DriverComplianceDetail;
  onOutcome: (outcome: DecisionOutcome) => void;
};

function driverUrl(token: string, action: "approve" | "reject"): string {
  return `/api/admin/drivers/${encodeURIComponent(token)}/${action}`;
}

/** Os erros que mudam a situação do cadastro: a tela tem de recarregar, não tentar de novo. */
function isRefusal(error: unknown): error is ApiProblemError {
  if (!(error instanceof ApiProblemError)) return false;
  const code = error.problem.code;
  return code === "driver.onboarding.documents_not_approved" || code === "driver.onboarding.not_under_review";
}

function errorText(error: unknown): string {
  return error instanceof ApiProblemError ? problemMessage(error.problem) : messages.errors.generic;
}

/**
 * Aprovar e reprovar o cadastro. Aprovar fica desligado enquanto a API diz que
 * não dá (`canApprove`), com o que falta embaixo; a API confere de novo na hora.
 */
export function DriverDecision({ detail, onOutcome }: DriverDecisionProps) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const blockersId = useId();

  if (!canDecideRegistration(detail.driver)) return null;

  const { canApprove, blockers } = detail.decision;
  const name = detail.driver.name ?? messages.noName;

  const finish = (outcome: DecisionOutcome) => {
    setDialog(null);
    onOutcome(outcome);
  };

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setDialog("reject")}
          className="h-10 rounded-lg border border-danger-border px-4 text-sm font-semibold text-danger transition-colors duration-150 hover:border-danger hover:bg-danger-soft"
        >
          {decision.reject}
        </button>
        <button
          type="button"
          onClick={() => setDialog("approve")}
          disabled={!canApprove}
          aria-describedby={canApprove ? undefined : blockersId}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition-all duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {decision.approve}
        </button>
      </div>
      {!canApprove && blockers.length > 0 && <BlockerList id={blockersId} blockers={blockers} />}

      <ApproveDialog
        open={dialog === "approve"}
        name={name}
        token={detail.driver.token}
        onCancel={() => setDialog(null)}
        onDone={finish}
      />
      <RejectDialog
        open={dialog === "reject"}
        name={name}
        token={detail.driver.token}
        onCancel={() => setDialog(null)}
        onDone={finish}
      />
    </div>
  );
}

export function BlockerList({
  id,
  blockers,
  align = "end",
}: {
  id?: string;
  blockers: Blocker[];
  align?: "start" | "end";
}) {
  return (
    <div id={id} className={`text-[13px] ${align === "end" ? "text-right text-muted-foreground" : "mt-1"}`}>
      {blockersSummary(blockers)}
    </div>
  );
}

export function ApproveDialog({
  open,
  name,
  token,
  onCancel,
  onDone,
}: {
  open: boolean;
  name: string;
  token: string;
  onCancel: () => void;
  onDone: (outcome: DecisionOutcome) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await fetchJson(driverUrl(token, "approve"), { method: "POST" });
      onDone({ kind: "approved" });
    } catch (caught) {
      if (isRefusal(caught)) {
        onDone({
          kind: "refused",
          message: problemMessage(caught.problem),
          blockers: caught.problem.blockers,
        });
      } else {
        setError(errorText(caught));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      tone="brand"
      title={interpolate(decision.approveTitle, { name })}
      description={decision.approveDescription}
      confirmLabel={decision.approve}
      busy={busy}
      error={error}
      onConfirm={() => void approve()}
      onCancel={() => {
        setError(null);
        onCancel();
      }}
    />
  );
}

function RejectDialog({
  open,
  name,
  token,
  onCancel,
  onDone,
}: {
  open: boolean;
  name: string;
  token: string;
  onCancel: () => void;
  onDone: (outcome: DecisionOutcome) => void;
}) {
  const titleId = useId();
  const [code, setCode] = useState<DriverRejectionReason | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalid = rejectionMessageError(code, message);

  function close() {
    if (busy) return;
    setCode(null);
    setMessage("");
    setError(null);
    onCancel();
  }

  async function reject(event: React.FormEvent) {
    event.preventDefault();
    if (invalid || !code) return;
    setBusy(true);
    setError(null);
    const body: DriverRejectionRequest = { reasonCode: code };
    const note = message.trim();
    if (note) body.reason = note;
    try {
      await fetchJson(driverUrl(token, "reject"), { method: "POST", body: JSON.stringify(body) });
      setCode(null);
      setMessage("");
      onDone({ kind: "rejected" });
    } catch (caught) {
      if (isRefusal(caught)) {
        onDone({ kind: "refused", message: problemMessage(caught.problem), blockers: [] });
      } else {
        setError(errorText(caught));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} className="max-w-lg">
      <form onSubmit={(event) => void reject(event)} className="p-6">
        <h2 id={titleId} className="font-display text-lg font-bold text-foreground">
          {interpolate(decision.rejectTitle, { name })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{decision.rejectDescription}</p>

        <ReasonFields
          codes={DRIVER_REJECTION_REASONS}
          labels={messages.driverRejectionReason}
          code={code}
          onCode={setCode}
          message={message}
          onMessage={setMessage}
          requiredWith="OTHER"
          disabled={busy}
        />

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-border-strong hover:bg-muted disabled:opacity-50"
          >
            {common.cancel}
          </button>
          <button
            type="submit"
            disabled={busy || invalid != null}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {busy ? common.loading : decision.rejectConfirm}
          </button>
        </div>
      </form>
    </Modal>
  );
}
