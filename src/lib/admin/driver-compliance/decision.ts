import { interpolate, plural, t } from "@/lib/l10n";

import { formatPlate } from "./driver-page";
import type {
  Blocker,
  ComplianceDriver,
  ComplianceState,
  DocumentRejectionReason,
  DriverRejectionReason,
} from "./types";

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

/**
 * Cada bloqueio numa frase curta: `Certidão criminal (pendente)`, `Vistoria da
 * van ABC-1D23 (vencido)`. Para listas sem o checklist ao lado (a tela de fim).
 */
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

const DOCUMENT_STATE_ORDER: readonly ComplianceState[] = ["PENDING", "EXPIRED", "REJECTED", "MISSING", "APPROVED"];

const listFormat = new Intl.ListFormat("pt-BR", { type: "conjunction" });

function isDocumentBlocker(blocker: Blocker): blocker is Blocker & { state: ComplianceState } {
  return (blocker.kind === "DRIVER_REQUIREMENT" || blocker.kind === "VEHICLE_REQUIREMENT") && blocker.state != null;
}

/**
 * Por que o cadastro não pode ser aprovado, numa frase só. Na página do
 * motorista o checklist já mostra cada documento, então aqui eles viram uma
 * contagem por situação (`faltam 6 documentos pendentes`, `faltam 3 documentos
 * (2 pendentes e 1 vencido)`). O que não é documento continua por extenso.
 */
export function blockersSummary(blockers: Blocker[]): string {
  if (blockers.length === 0) return "";
  const byState = new Map<ComplianceState, number>();
  const others: string[] = [];
  for (const blocker of blockers) {
    if (isDocumentBlocker(blocker)) byState.set(blocker.state, (byState.get(blocker.state) ?? 0) + 1);
    else others.push(blockerText(blocker));
  }

  const states = DOCUMENT_STATE_ORDER.filter((state) => byState.has(state));
  const count = (state: ComplianceState) => byState.get(state) ?? 0;
  const documents = states.reduce((sum, state) => sum + count(state), 0);

  const items: string[] = [];
  if (states.length === 1) {
    items.push(plural(decision.documentsInState[states[0]], documents));
  } else if (states.length > 1) {
    items.push(
      interpolate(decision.documentsByState, {
        documents: plural(decision.documents, documents),
        states: listFormat.format(states.map((state) => plural(decision.stateCount[state], count(state)))),
      }),
    );
  }
  items.push(...others);

  return plural(decision.blockedSummary, documents + others.length, { items: listFormat.format(items) });
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
