"use client";

import { useId } from "react";

import { REASON_MAX_LENGTH } from "@/lib/admin/driver-compliance/decision";
import { interpolate, t } from "@/lib/l10n";

const decision = t("admin").driverReview.decision;

type ReasonFieldsProps<C extends string> = {
  codes: readonly C[];
  labels: Record<C, string>;
  code: C | null;
  onCode: (code: C) => void;
  message: string;
  onMessage: (message: string) => void;
  /** A mensagem é obrigatória com este código (o `OTHER`). */
  requiredWith: C;
  disabled?: boolean;
};

/** O motivo estruturado de uma recusa e a mensagem livre, como a API recebe. */
export function ReasonFields<C extends string>({
  codes,
  labels,
  code,
  onCode,
  message,
  onMessage,
  requiredWith,
  disabled = false,
}: ReasonFieldsProps<C>) {
  const name = useId();
  const messageId = useId();
  const counterId = useId();
  const required = code === requiredWith;

  return (
    <>
      <fieldset disabled={disabled} className="mt-5">
        <legend className="text-sm font-semibold text-foreground">{decision.reasonLegend}</legend>
        <div className="mt-2 flex flex-col gap-1">
          {codes.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground hover:bg-background-deep has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={code === option}
                onChange={() => onCode(option)}
                className="accent-brand"
              />
              {labels[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor={messageId} className="text-sm font-semibold text-foreground">
          {decision.messageLabel}{" "}
          <span className="font-normal text-muted-foreground">
            {required ? decision.messageRequired : decision.messageOptional}
          </span>
        </label>
        <textarea
          id={messageId}
          rows={3}
          value={message}
          maxLength={REASON_MAX_LENGTH}
          required={required}
          disabled={disabled}
          aria-describedby={counterId}
          onChange={(event) => onMessage(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand disabled:opacity-60"
        />
        <p id={counterId} className="mt-1 text-right text-xs text-muted-foreground">
          {interpolate(decision.messageCount, { count: message.length, max: REASON_MAX_LENGTH })}
        </p>
      </div>
    </>
  );
}
