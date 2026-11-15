"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadError } from "@/components/admin/load-error";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import { driverHref, reviewHref } from "@/lib/admin/driver-compliance/review";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { driverComplianceUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { t } from "@/lib/l10n";

const messages = t("admin").driverReview;

/**
 * Entrada da revisão: lê a página do motorista e abre o primeiro pendente da
 * fila dele. Sem pendentes, volta ao motorista.
 */
export default function ReviewEntryPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { state, reload } = useJsonResource<DriverComplianceDetail>(driverComplianceUrl(token));

  const first = state.status === "ready" ? (state.data.reviewQueue[0] ?? null) : undefined;

  useEffect(() => {
    if (first === undefined) return;
    router.replace(first ? reviewHref(token, first.kind, first.token) : driverHref(token));
  }, [first, router, token]);

  if (state.status === "error") {
    const message =
      state.error instanceof ApiProblemError ? problemMessage(state.error.problem) : messages.driver.loadError;
    return <LoadError message={message} onRetry={reload} />;
  }
  return <p className="text-sm text-muted-foreground">{messages.review.loading}</p>;
}
