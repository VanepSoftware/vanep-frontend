import { interpolate, t } from "@/lib/l10n";

import { formatPlate } from "./driver-page";
import type { Blocker, ComplianceDriver, DocumentRejectionReason, DriverRejectionReason } from "./types";

const messages = t("admin").driverReview;
const decision = messages.decision;

/** O limite da mensagem da recusa na API, do documento e do cadastro. */
export const REASON_MAX_LENGTH = 255;

export const DRIVER_REJECTION_REASONS: readonly DriverRejectionReason[] = [
  "DATA_MISMATCH",
  "NOT_ELIGIBLE",
  "DUPLICATE_ACCOUNT",
  "OTHER",
];

/** Aprovar e recusar o cadastro só valem com ele em análise; fora disso a API dá 400. */
export function canDecideRegistration(driver: ComplianceDriver): boolean {
  return driver.approvalStatus === "UNDER_REVIEW";
}

/** Cada bloqueio numa frase curta: `Certidão criminal (pendente)`, `Vistoria da van ABC-1D23 (vencido)`. */
export function blockerText(blocker: Blocker): string {
  switch (blocker.kind) {
    case "NO_ACTIVE_VEHICLE":
    case "CNH_CATEGORY":
    case "APPROVAL_STATUS":
      return decision.blocker[blocker.kind];
    case "DRIVER_REQUIREMENT":
    case "VEHICLE_REQUIREMENT": {
      const requirement = blocker.requirement ? messages.requirement[blocker.requirement] : messages.noValue;
      const state = blocker.state ? decision.blockerState[blocker.state] : messages.noValue;
      if (blocker.kind === "VEHICLE_REQUIREMENT" && blocker.plate) {
        return interpolate(decision.blocker.vehicleRequirement, {
          requirement,
          plate: formatPlate(blocker.plate),
          state,
        });
      }
      return interpolate(decision.blocker.requirement, { requirement, state });
    }
  }
}

/**
 * Valida a mensagem de uma recusa como a API: obrigatória só com `OTHER`, até
 * 255 caracteres. Devolve a chave do erro, ou `null` se pode enviar.
 */
export function rejectionMessageError(
  code: DocumentRejectionReason | DriverRejectionReason | null,
  message: string,
): "reasonCode" | "messageRequired" | "messageTooLong" | null {
  if (!code) return "reasonCode";
  if (message.length > REASON_MAX_LENGTH) return "messageTooLong";
  if (code === "OTHER" && !message.trim()) return "messageRequired";
  return null;
}
