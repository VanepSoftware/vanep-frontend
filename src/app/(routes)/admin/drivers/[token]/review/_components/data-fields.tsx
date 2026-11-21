"use client";

import { expiryDistance } from "@/lib/admin/driver-compliance/format";
import {
  type DataField,
  type DataValues,
  type FieldErrors,
  type FieldSpec,
  isExpiryField,
  normalizeInput,
} from "@/lib/admin/driver-compliance/submission-data";
import type { DocumentRejectionReason, IsoDate } from "@/lib/admin/driver-compliance/types";
import { t } from "@/lib/l10n";

const data = t("admin").driverReview.review.data;

type DataFieldsProps = {
  /** Prefixo dos `id`, para o painel levar o foco ao primeiro campo com erro. */
  idPrefix: string;
  fields: readonly FieldSpec[];
  values: DataValues;
  errors: FieldErrors;
  today: IsoDate;
  disabled: boolean;
  onChange: (field: DataField, value: string) => void;
  /** Na aprovação, o atalho para reprovar quando o arquivo mostra que o documento não serve. */
  onRejectAs?: (code: DocumentRejectionReason) => void;
};

export function fieldId(idPrefix: string, field: DataField): string {
  return `${idPrefix}-${field}`;
}

const INPUT =
  "mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand disabled:opacity-60";

/**
 * Os dados do documento, na ordem em que aparecem nele. Os obrigatórios do
 * tipo não têm marca; os outros dizem "(opcional)".
 */
export function DataFields({ idPrefix, fields, values, errors, today, disabled, onChange, onRejectAs }: DataFieldsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
      {fields.map((spec) => {
        const id = fieldId(idPrefix, spec.name);
        const value = values[spec.name] ?? "";
        const error = errors[spec.name];
        const hintId = `${id}-hint`;
        const hint = fieldHint(spec, value, today, error != null);
        // As datas e as listas curtas dividem a linha; números e categoria ocupam a largura toda.
        const wide = spec.input === "text" || spec.name === "registrationNumber" || spec.name === "category";

        return (
          <div key={spec.name} className={wide ? "col-span-2" : "col-span-1"}>
            <label htmlFor={id} className="text-[13px] font-medium text-foreground">
              {data.fields[spec.name]}
              {!spec.required && <span className="font-normal text-muted-foreground"> {data.optional}</span>}
            </label>
            <FieldInput
              id={id}
              spec={spec}
              value={value}
              disabled={disabled}
              invalid={error != null}
              describedBy={error || hint ? hintId : undefined}
              onChange={(next) => onChange(spec.name, normalizeInput(spec, next))}
            />
            {error ? (
              <p id={hintId} className="mt-1 text-xs text-danger">
                {error.message}
                {error.expired && onRejectAs && (
                  <>
                    {" "}
                    <RejectLink onClick={() => onRejectAs("EXPIRED")}>{data.rejectExpired}</RejectLink>
                  </>
                )}
              </p>
            ) : (
              hint && (
                <p id={hintId} className="mt-1 text-xs text-muted-foreground">
                  {hint}
                </p>
              )
            )}
            {spec.name === "category" && onRejectAs && (
              <p className="mt-1 text-xs text-muted-foreground">
                {data.categoryHint}{" "}
                <RejectLink onClick={() => onRejectAs("NOT_ELIGIBLE")}>{data.rejectNotEligible}</RejectLink>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Embaixo da validade, quanto falta: "vence em 92 dias". */
function fieldHint(spec: FieldSpec, value: string, today: IsoDate, hasError: boolean): string | null {
  if (hasError || !value || !isExpiryField(spec.name)) return null;
  return expiryDistance(value, today);
}

function FieldInput({
  id,
  spec,
  value,
  disabled,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  spec: FieldSpec;
  value: string;
  disabled: boolean;
  invalid: boolean;
  describedBy: string | undefined;
  onChange: (value: string) => void;
}) {
  const className = `${INPUT} ${invalid ? "border-danger" : "border-border"}`;
  const common = {
    id,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    className,
  };

  if (spec.input === "select") {
    return (
      <select {...common} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{spec.required ? data.choose : data.none}</option>
        {spec.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...common}
      type={spec.input === "date" ? "date" : "text"}
      inputMode={spec.input === "digits" ? "numeric" : undefined}
      autoComplete="off"
      maxLength={spec.maxLength}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function RejectLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-semibold text-danger underline-offset-2 hover:underline">
      {children}
    </button>
  );
}
