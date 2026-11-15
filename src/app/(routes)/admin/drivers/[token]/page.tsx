"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { LoadError } from "@/components/admin/load-error";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { driverComplianceUrl } from "@/lib/admin/driver-compliance/urls";
import { ApiProblemError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { t } from "@/lib/l10n";

import { DriverData } from "./_components/driver-data";
import { DriverBreadcrumb, DriverHeader } from "./_components/driver-header";
import { HistoryList } from "./_components/history-list";
import { RequirementsList } from "./_components/requirements-list";

const messages = t("admin").driverReview;
const page = messages.driver;

function errorMessage(error: unknown): string {
  return error instanceof ApiProblemError ? problemMessage(error.problem) : page.loadError;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiProblemError && error.problem.status === 404;
}

export default function DriverCompliancePage() {
  const { token } = useParams<{ token: string }>();
  const { state, latest, reload } = useJsonResource<DriverComplianceDetail>(driverComplianceUrl(token));
  const detail = state.status === "ready" ? state.data : latest;

  if (!detail) {
    if (state.status === "error" && isNotFound(state.error)) return <NotFound />;
    if (state.status === "error") return <LoadError message={errorMessage(state.error)} onRetry={reload} />;
    return <p className="text-sm text-muted-foreground">{page.loading}</p>;
  }

  return (
    <div>
      <DriverBreadcrumb name={detail.driver.name ?? messages.noName} />
      {state.status === "error" && <LoadError message={errorMessage(state.error)} onRetry={reload} />}
      <DriverHeader detail={detail} />
      <DriverData driver={detail.driver} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <RequirementsList detail={detail} />
        <HistoryList history={detail.history} />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-2xl border border-border bg-background p-10 text-center">
      <p className="text-sm text-muted-foreground">{page.notFound}</p>
      <Link href="/admin/drivers" className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-strong">
        {page.backToQueue}
      </Link>
    </div>
  );
}
