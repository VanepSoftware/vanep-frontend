"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { dateToIso, displayDate, isIsoDate, isoToDate, typedDate } from "@/lib/date-input";
import { interpolate, t } from "@/lib/l10n";

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
  /** Na aprovação, o atalho para reprovar quando a validade já passou. */
  onRejectAs?: (code: DocumentRejectionReason) => void;
};

export function fieldId(idPrefix: string, field: DataField): string {
  return `${idPrefix}-${field}`;
}

/** Os campos do shadcn na altura dos botões do painel. */
const CONTROL = "mt-1.5 h-10 bg-background";

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
        const control = {
          id,
          disabled,
          invalid: error != null,
          describedBy: error || hint ? hintId : undefined,
        };

        return (
          <div key={spec.name} className={wide ? "col-span-2" : "col-span-1"}>
            <Label htmlFor={id} className="block text-[13px]">
              {data.fields[spec.name]}
              {!spec.required && <span className="font-normal text-muted-foreground"> {data.optional}</span>}
            </Label>
            {spec.input === "select" ? (
              <SelectField {...control} spec={spec} value={value} onChange={(next) => onChange(spec.name, next)} />
            ) : spec.input === "date" ? (
              <DateField
                {...control}
                label={data.fields[spec.name]}
                value={value}
                today={today}
                onChange={(next) => onChange(spec.name, next)}
              />
            ) : (
              <Input
                id={id}
                disabled={disabled}
                aria-invalid={control.invalid || undefined}
                aria-describedby={control.describedBy}
                inputMode={spec.input === "digits" ? "numeric" : undefined}
                autoComplete="off"
                maxLength={spec.maxLength}
                value={value}
                onChange={(event) => onChange(spec.name, normalizeInput(spec, event.target.value))}
                className={CONTROL}
              />
            )}
            {error ? (
              <p id={hintId} className="mt-1 text-xs text-danger">
                {error.message}
                {error.expired && onRejectAs && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => onRejectAs("EXPIRED")}
                      className="font-semibold text-danger underline-offset-2 hover:underline"
                    >
                      {data.rejectExpired}
                    </button>
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
          </div>
        );
      })}
    </div>
  );
}

/** Embaixo da validade, quanto falta: "vence em 92 dias". */
function fieldHint(spec: FieldSpec, value: string, today: IsoDate, hasError: boolean): string | null {
  if (hasError || !isExpiryField(spec.name) || !isIsoDate(value)) return null;
  return expiryDistance(value, today);
}

type ControlProps = {
  id: string;
  disabled: boolean;
  invalid: boolean;
  describedBy: string | undefined;
};

/** O Select do Radix não aceita item de valor vazio: "não informada" usa este. */
const NONE = "__none__";

function SelectField({
  id,
  disabled,
  invalid,
  describedBy,
  spec,
  value,
  onChange,
}: ControlProps & { spec: FieldSpec; value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next === NONE ? "" : next)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${CONTROL} w-full`}
      >
        <SelectValue placeholder={spec.required ? data.choose : data.none} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-64">
        {!spec.required && <SelectItem value={NONE}>{data.none}</SelectItem>}
        {spec.options?.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Os anos do seletor do calendário: de quem tirou a 1ª habilitação até validades longas. */
const FIRST_YEAR = 1950;
const YEARS_AHEAD = 20;

/**
 * Digitar olhando o documento é o caminho rápido ("10032029" vira 10/03/2029);
 * o calendário fica ao lado para quem prefere escolher.
 */
function DateField({
  id,
  disabled,
  invalid,
  describedBy,
  label,
  value,
  today,
  onChange,
}: ControlProps & { label: string; value: string; today: IsoDate; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = isoToDate(value);
  const now = isoToDate(today) ?? new Date();

  return (
    <div className="relative mt-1.5">
      <Input
        id={id}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        inputMode="numeric"
        autoComplete="off"
        placeholder={data.datePlaceholder}
        value={displayDate(value)}
        onChange={(event) => onChange(typedDate(event.target.value))}
        className="h-10 bg-background pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={interpolate(data.openCalendar, { field: label })}
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
          >
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={ptBR}
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected ?? now}
            startMonth={new Date(FIRST_YEAR, 0)}
            endMonth={new Date(now.getFullYear() + YEARS_AHEAD, 11)}
            onSelect={(date) => {
              if (!date) return;
              onChange(dateToIso(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
