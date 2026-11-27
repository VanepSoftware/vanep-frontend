"use client";

import Link from "next/link";
import { useState } from "react";

import { useDriverReviewCounts } from "@/components/admin/driver-review-counts";
import { Chip } from "@/components/ui/chip";
import { blockerText } from "@/lib/admin/driver-compliance/decision";
import { formatPlate } from "@/lib/admin/driver-compliance/driver-page";
import { parseQueuePage } from "@/lib/admin/driver-compliance/queue";
import {
  type DoneScenario,
  driverHref,
  doneScenario,
  nextDriverInQueue,
  reviewEntryHref,
} from "@/lib/admin/driver-compliance/review";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { interpolate, t } from "@/lib/l10n";

import { ApproveDialog, type DecisionOutcome } from "../../_components/driver-decision";

const messages = t("admin").driverReview;
const done = messages.review.done;

/** Os mais antigos com documento pendente; basta passar do motorista atual. */
const NEXT_DRIVER_URL = "/api/admin/drivers/compliance?view=PENDING_DOCUMENTS&size=5";

type Shown = DoneScenario | "approved";

/** O fim da revisão de um motorista: aprovar o cadastro, ou seguir para o próximo da fila. */
type ReviewDoneProps = {
  detail: DriverComplianceDetail;
  /** A API recusou a aprovação (o cadastro mudou): quem mostra decide como avisar. */
  onRefused: (outcome: DecisionOutcome) => void;
};

export function ReviewDone({ detail, onRefused }: ReviewDoneProps) {
  const [approved, setApproved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { refresh: refreshCounts } = useDriverReviewCounts();
  const shown: Shown = approved ? "approved" : doneScenario(detail);
  const name = detail.driver.name ?? messages.noName;

  function onOutcome(outcome: DecisionOutcome) {
    setConfirming(false);
    refreshCounts();
    if (outcome.kind === "approved") setApproved(true);
    else onRefused(outcome);
  }

  return (
    <section
      aria-labelledby="review-done-title"
      className="mx-auto max-w-xl rounded-2xl border border-border bg-background p-8"
    >
      <h1 id="review-done-title" className="font-display text-xl font-bold text-foreground">
        {title(shown)}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{interpolate(description(shown), { name })}</p>

      {shown === "ready" && <ReadySummary detail={detail} />}
      {shown === "blocked" && (
        <ul className="mt-5 flex flex-col divide-y divide-border rounded-xl border border-border">
          {detail.decision.blockers.map((blocker, index) => (
            <li key={index} className="px-4 py-2.5 text-sm text-foreground">
              {blockerText(blocker)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {shown === "ready" ? (
          <>
            <Link
              href={driverHref(detail.driver.token)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:border-border-strong hover:bg-muted"
            >
              {done.notNow}
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm hover:brightness-110"
            >
              {messages.decision.approve}
            </button>
          </>
        ) : (
          <>
            <Link
              href={driverHref(detail.driver.token)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:border-border-strong hover:bg-muted"
            >
              {done.viewDriver}
            </Link>
            <NextDriverLink currentToken={detail.driver.token} />
          </>
        )}
      </div>

      <ApproveDialog
        open={confirming}
        name={name}
        token={detail.driver.token}
        onCancel={() => setConfirming(false)}
        onDone={onOutcome}
      />
    </section>
  );
}

function title(shown: Shown): string {
  switch (shown) {
    case "ready":
      return done.readyTitle;
    case "blocked":
      return done.blockedTitle;
    case "clear":
      return done.clearTitle;
    case "approved":
      return done.approvedTitle;
  }
}

function description(shown: Shown): string {
  switch (shown) {
    case "ready":
      return done.readyDescription;
    case "blocked":
      return done.blockedDescription;
    case "clear":
      return done.clearDescription;
    case "approved":
      return done.approvedDescription;
  }
}

/** O que sustenta a aprovação: os documentos do motorista e as vans prontas. */
function ReadySummary({ detail }: { detail: DriverComplianceDetail }) {
  const optional = detail.driverRequirements.filter((item) => item.optional && !item.satisfied);
  return (
    <ul className="mt-5 flex flex-col divide-y divide-border rounded-xl border border-border">
      <SummaryLine label={done.driverRequirements}>
        <Chip tone="success">{done.approved}</Chip>
      </SummaryLine>
      {detail.vehicles
        .filter((vehicle) => vehicle.qualified)
        .map((vehicle) => (
          <SummaryLine key={vehicle.token} label={interpolate(done.vehicle, { plate: formatPlate(vehicle.plate) })}>
            <Chip tone="success">{done.qualified}</Chip>
          </SummaryLine>
        ))}
      {optional.map((item) => (
        <SummaryLine
          key={item.requirement}
          label={`${messages.requirement[item.requirement]} (${messages.driver.optional})`}
        >
          <Chip tone="outline">{messages.complianceState[item.state]}</Chip>
        </SummaryLine>
      ))}
    </ul>
  );
}

function SummaryLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground">
      <span>{label}</span>
      {children}
    </li>
  );
}

function NextDriverLink({ currentToken }: { currentToken: string }) {
  const { state } = useJsonResource<unknown>(NEXT_DRIVER_URL);
  const next = state.status === "ready" ? nextDriverInQueue(parseQueuePage(state.data).content, currentToken) : null;
  const className =
    "inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm hover:brightness-110";

  if (!next) {
    return (
      <Link href="/admin/drivers" className={className}>
        {done.backToQueue}
      </Link>
    );
  }
  return (
    <Link href={reviewEntryHref(next.token)} className={className}>
      {interpolate(done.nextDriver, { name: next.name ?? messages.noName })}
    </Link>
  );
}
