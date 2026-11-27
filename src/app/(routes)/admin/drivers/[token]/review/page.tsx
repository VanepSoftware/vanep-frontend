"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadError } from "@/components/admin/load-error";
import { Notice } from "@/components/admin/notice";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import { reviewHref } from "@/lib/admin/driver-compliance/review";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { driverComplianceUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { t } from "@/lib/l10n";

import type { DecisionOutcome } from "../_components/driver-decision";
import { ReviewDone } from "./_components/review-done";

const messages = t("admin").driverReview;
const common = t("common");

/**
 * Entrada da revisão: lê a página do motorista e abre o primeiro pendente da
 * fila dele. Sem pendentes, mostra o fim: aprovar o cadastro ou seguir a fila.
 */
export default function ReviewEntryPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { state, latest, reload } = useJsonResource<DriverComplianceDetail>(driverComplianceUrl(token));
  const [refused, setRefused] = useState<{ token: string; message: string } | null>(null);

  const first = state.status === "ready" ? (state.data.reviewQueue[0] ?? null) : undefined;

  useEffect(() => {
    if (first) router.replace(reviewHref(token, first.kind, first.token));
  }, [first, router, token]);

  const detail = state.status === "ready" ? state.data : latest;

  if (state.status === "error" && !detail) {
    const message =
      state.error instanceof ApiProblemError ? problemMessage(state.error.problem) : messages.driver.loadError;
    return <LoadError message={message} onRetry={reload} />;
  }
  if (!detail || first) return <p className="text-sm text-muted-foreground">{messages.review.loading}</p>;

  function onRefused(outcome: DecisionOutcome) {
    if (outcome.kind !== "refused") return;
    setRefused({ token, message: outcome.message });
    reload();
  }

  return (
    <div>
      {refused?.token === token && (
        <Notice tone="danger" onDismiss={() => setRefused(null)} dismissLabel={common.close}>
          {refused.message}
        </Notice>
      )}
      {/* O estado do fim (aprovado agora) é deste motorista; outro motorista começa do zero. */}
      <ReviewDone key={detail.driver.token} detail={detail} onRefused={onRefused} />
    </div>
  );
}
