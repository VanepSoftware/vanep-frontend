"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useDriverReviewCounts } from "@/components/admin/driver-review-counts";
import { LoadError } from "@/components/admin/load-error";
import { Notice } from "@/components/admin/notice";
import { formatPlate } from "@/lib/admin/driver-compliance/driver-page";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import {
  type FoundSubmission,
  type QueuePosition,
  driverHref,
  findSubmission,
  parseKindSlug,
  queuePosition,
  reviewEntryHref,
  reviewHref,
} from "@/lib/admin/driver-compliance/review";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { driverComplianceUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { interpolate, t } from "@/lib/l10n";

import { DriverBreadcrumb } from "../../../_components/driver-header";
import { FileViewer } from "../../_components/file-viewer";
import { type ReviewOutcome, ReviewPanel } from "../../_components/review-panel";

const messages = t("admin").driverReview;
const review = messages.review;
const common = t("common");

type Params = { token: string; kind: string; submission: string };

export default function SubmissionReviewPage() {
  const params = useParams<Params>();
  const kind = parseKindSlug(params.kind);
  const router = useRouter();
  const { refresh: refreshCounts } = useDriverReviewCounts();
  const { state, latest, reload } = useJsonResource<DriverComplianceDetail>(
    kind ? driverComplianceUrl(params.token) : null,
  );
  // O aviso de "mudou" vale para o envio em que aconteceu.
  const [stale, setStale] = useState<{ submission: string; message: string } | null>(null);

  if (!kind) return <SubmissionNotFound driverToken={params.token} />;

  const detail = state.status === "ready" ? state.data : latest;
  if (!detail) {
    if (state.status === "error") {
      const message = state.error instanceof ApiProblemError ? problemMessage(state.error.problem) : messages.driver.loadError;
      return <LoadError message={message} onRetry={reload} />;
    }
    return <p className="text-sm text-muted-foreground">{review.loading}</p>;
  }

  const found = findSubmission(detail, kind, params.submission);
  if (!found) return <SubmissionNotFound driverToken={params.token} />;

  const position = queuePosition(detail, kind, params.submission);

  function onOutcome(outcome: ReviewOutcome) {
    if (outcome.kind === "stale") {
      setStale({ submission: params.submission, message: outcome.message });
      reload();
      return;
    }
    refreshCounts();
    // A entrada abre o próximo pendente da página atualizada, ou a tela de fim.
    router.replace(reviewEntryHref(params.token));
  }

  return (
    <div>
      <ReviewHeader detail={detail} found={found} position={position} />
      {stale?.submission === params.submission && (
        <Notice tone="danger" onDismiss={() => setStale(null)} dismissLabel={common.close}>
          {stale.message}
        </Notice>
      )}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <FileViewer submission={found.submission} />
        <ReviewPanel
          key={`${found.submission.token}-${found.submission.version}`}
          detail={detail}
          found={found}
          onOutcome={onOutcome}
        />
      </div>
    </div>
  );
}

function ReviewHeader({
  detail,
  found,
  position,
}: {
  detail: DriverComplianceDetail;
  found: FoundSubmission;
  position: QueuePosition | null;
}) {
  const driverToken = detail.driver.token;
  const document = messages.requirement[found.item.requirement];
  const owner = found.vehicle
    ? interpolate(review.vehicleDocument, { plate: formatPlate(found.vehicle.plate) })
    : review.driverDocument;

  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <DriverBreadcrumb
          name={detail.driver.name ?? messages.noName}
          child={{ driverHref: driverHref(driverToken), label: document }}
        />
        <h1 className="font-display text-2xl font-bold text-foreground">{document}</h1>
        <p className="text-sm text-muted-foreground">{owner}</p>
      </div>

      {position && (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-sm text-muted-foreground">
              {interpolate(review.position, { position: position.position, total: position.total })}
            </span>
            <span aria-hidden="true" className="flex gap-1">
              {Array.from({ length: position.total }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-6 rounded-full ${index < position.position ? "bg-brand" : "bg-border"}`}
                />
              ))}
            </span>
          </div>
          <div className="flex gap-1">
            <StepLink
              label={review.previous}
              href={position.previous && reviewHref(driverToken, position.previous.kind, position.previous.token)}
              path="m15 6-6 6 6 6"
            />
            <StepLink
              label={review.next}
              href={position.next && reviewHref(driverToken, position.next.kind, position.next.token)}
              path="m9 6 6 6-6 6"
            />
          </div>
        </div>
      )}
    </header>
  );
}

function StepLink({ label, href, path }: { label: string; href: string | null; path: string }) {
  const className =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground";
  const icon = (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
  if (!href) {
    return (
      <span aria-disabled="true" aria-label={label} className={`${className} opacity-40`}>
        {icon}
      </span>
    );
  }
  return (
    <Link href={href} replace aria-label={label} title={label} className={`${className} hover:border-border-strong hover:bg-muted`}>
      {icon}
    </Link>
  );
}

function SubmissionNotFound({ driverToken }: { driverToken: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-10 text-center">
      <p className="text-sm text-muted-foreground">{review.notFound}</p>
      <Link
        href={driverHref(driverToken)}
        className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {review.backToDriver}
      </Link>
    </div>
  );
}
