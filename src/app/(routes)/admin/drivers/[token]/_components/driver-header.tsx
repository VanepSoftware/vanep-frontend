import Link from "next/link";

import { Chip } from "@/components/ui/chip";
import { driverRejectionText, statusLine } from "@/lib/admin/driver-compliance/driver-page";
import { initials } from "@/lib/admin/driver-compliance/queue";
import { approvalStatusTone } from "@/lib/admin/driver-compliance/tone";
import type { DriverComplianceDetail } from "@/lib/admin/driver-compliance/types";
import { t } from "@/lib/l10n";

const messages = t("admin").driverReview;

type DriverHeaderProps = {
  detail: DriverComplianceDetail;
  /** As decisões do cadastro (F4) entram aqui. */
  actions?: React.ReactNode;
};

type DriverBreadcrumbProps = {
  name: string;
  /**
   * Abaixo da página do motorista (a revisão de um documento): o nome vira
   * link para ela e o documento é a página atual.
   */
  child?: { driverHref: string; label: string };
};

/** `Motoristas / Nome` na página do motorista; `Motoristas / Nome / Documento` abaixo dela. */
export function DriverBreadcrumb({ name, child }: DriverBreadcrumbProps) {
  return (
    <nav aria-label={messages.driver.breadcrumb} className="mb-4 flex min-w-0 items-center gap-2 text-sm">
      <Link href="/admin/drivers" className="shrink-0 text-brand hover:text-brand-strong">
        {messages.queue.title}
      </Link>
      <Separator />
      {child ? (
        <>
          <Link href={child.driverHref} className="truncate text-brand hover:text-brand-strong">
            {name}
          </Link>
          <Separator />
          <span aria-current="page" className="truncate text-muted-foreground">
            {child.label}
          </span>
        </>
      ) : (
        <span aria-current="page" className="truncate text-muted-foreground">
          {name}
        </span>
      )}
    </nav>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="text-border-strong">
      /
    </span>
  );
}

export function DriverHeader({ detail, actions }: DriverHeaderProps) {
  const { driver } = detail;
  const name = driver.name ?? messages.noName;
  const rejection = driverRejectionText(driver);
  const where = driver.city ? ` · ${driver.city}` : "";

  return (
    <section className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-background p-6">
      <div className="flex min-w-0 items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-background-soft text-lg font-semibold text-brand-strong"
        >
          {initials(driver.name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{name}</h1>
            <Chip tone={approvalStatusTone(driver.approvalStatus)}>
              {messages.approvalStatus[driver.approvalStatus]}
            </Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusLine(driver, detail.asOf)}
            {where}
          </p>
          {rejection && <p className="mt-1 text-sm text-danger">{rejection}</p>}
        </div>
      </div>
      {actions}
    </section>
  );
}
