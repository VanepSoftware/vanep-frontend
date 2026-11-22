"use client";

import { useState } from "react";

import {
  formatCpf,
  formatPhone,
  maskCpf,
  maskPhone,
} from "@/lib/admin/driver-compliance/driver-page";
import { formatDate, formatInstantDate } from "@/lib/admin/driver-compliance/format";
import type { ComplianceDriver } from "@/lib/admin/driver-compliance/types";
import { plural, t } from "@/lib/l10n";

const messages = t("admin").driverReview;
const page = messages.driver;

/**
 * Dados do cadastro. CPF e telefone aparecem mascarados e só se mostram
 * inteiros a pedido, para não ficarem expostos na tela de quem passa.
 */
export function DriverData({ driver }: { driver: ComplianceDriver }) {
  return (
    <section aria-labelledby="driver-data-title" className="mb-6 rounded-2xl border border-border bg-background p-6">
      <h2 id="driver-data-title" className="font-display text-base font-bold text-foreground">
        {page.dataTitle}
      </h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={page.fields.email} value={driver.email} />
        <SensitiveField
          field="phone"
          label={page.fields.phone}
          value={driver.phone}
          format={formatPhone}
          mask={maskPhone}
        />
        <SensitiveField
          field="document"
          label={page.fields.document}
          value={driver.document}
          format={formatCpf}
          mask={maskCpf}
        />
        <Field label={page.fields.birthDate} value={driver.birthDate && formatDate(driver.birthDate)} />
        <Field
          label={page.fields.experience}
          value={driver.experienceYears != null ? plural(page.experienceYears, driver.experienceYears) : null}
        />
        <Field label={page.fields.createdAt} value={formatInstantDate(driver.createdAt)} />
      </dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{value ?? messages.noValue}</dd>
    </div>
  );
}

function SensitiveField({
  field,
  label,
  value,
  format,
  mask,
}: {
  field: keyof typeof page.revealLabel;
  label: string;
  value: string | null;
  format: (value: string) => string;
  mask: (value: string) => string;
}) {
  const [revealed, setRevealed] = useState(false);
  if (!value) return <Field label={label} value={null} />;

  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="truncate tabular-nums">{revealed ? format(value) : mask(value)}</span>
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? page.hideLabel[field] : page.revealLabel[field]}
          className="text-xs font-semibold text-brand hover:text-brand-strong"
        >
          {revealed ? page.hide : page.reveal}
        </button>
      </dd>
    </div>
  );
}
