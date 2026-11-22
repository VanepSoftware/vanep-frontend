import { interpolate, plural, t } from "@/lib/l10n";

import { formatDate, formatDateTime, formatShortDateTime, relativeDaysAgo } from "./format";
import type {
  ComplianceDriver,
  ComplianceState,
  ComplianceVehicle,
  CredentialRequirement,
  DriverComplianceDetail,
  HistoryEvent,
  LastDecision,
  RequirementStatus,
  Submission,
  UserRef,
} from "./types";

const messages = t("admin").driverReview;
const page = messages.driver;

// ---------------------------------------------------------------- dados pessoais

const digits = (value: string) => value.replace(/\D/g, "");

/** `12345678910` → `123.456.789-10`. Outro tamanho volta como veio. */
export function formatCpf(value: string): string {
  const d = digits(value);
  if (d.length !== 11) return value;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Mostra só o meio e o fim do CPF: `•••.456.•••-10`. */
export function maskCpf(value: string): string {
  const d = digits(value);
  if (d.length !== 11) return "•••";
  return `•••.${d.slice(3, 6)}.•••-${d.slice(9)}`;
}

/** `61912344821` → `(61) 91234-4821`; fixo com 10 dígitos → `(61) 3123-4821`. */
export function formatPhone(value: string): string {
  const d = digits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

/** Mantém o DDD, o primeiro dígito e os 4 últimos: `(61) 9••••-4821`. */
export function maskPhone(value: string): string {
  const d = digits(value);
  if (d.length < 10) return "•••";
  return `(${d.slice(0, 2)}) ${d[2]}${"•".repeat(d.length - 7)}-${d.slice(-4)}`;
}

/** As placas novas são gravadas sem hífen (D17 a); a tela mostra `ABC-1D23`. */
export function formatPlate(plate: string): string {
  const p = plate.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{7}$/.test(p) ? `${p.slice(0, 3)}-${p.slice(3)}` : plate;
}

function actorName(actor: UserRef | null): string {
  return actor?.name ?? page.someone;
}

// ---------------------------------------------------------------- cabeçalho

/** A linha embaixo do nome: onde o cadastro está e desde quando. */
export function statusLine(driver: ComplianceDriver, today: string): string {
  switch (driver.approvalStatus) {
    case "APPROVED":
      if (driver.reviewedAt) {
        return interpolate(page.status.approved, {
          at: formatDateTime(driver.reviewedAt),
          actor: actorName(driver.reviewedBy),
        });
      }
      break;
    case "REJECTED":
      if (driver.reviewedAt) {
        return interpolate(page.status.rejected, {
          at: formatDateTime(driver.reviewedAt),
          actor: actorName(driver.reviewedBy),
        });
      }
      break;
    case "UNDER_REVIEW":
    case "PENDING":
      break;
  }
  if (driver.submittedAt) {
    return interpolate(page.status.submitted, {
      ago: relativeDaysAgo(driver.submittedAt, today),
      at: formatDateTime(driver.submittedAt),
    });
  }
  return page.status.notSubmitted;
}

/** O motivo da recusa do cadastro, quando há. */
export function driverRejectionText(driver: ComplianceDriver): string | null {
  if (driver.approvalStatus !== "REJECTED" || !driver.rejectionReasonCode) return null;
  const code = driver.rejectionReasonCode;
  const reason =
    code === "OTHER" && driver.rejectionReason
      ? driver.rejectionReason
      : [messages.driverRejectionReason[code], driver.rejectionReason].filter(Boolean).join(" · ");
  return interpolate(page.rejectedReason, { reason });
}

// ---------------------------------------------------------------- requisitos

const SUMMARY_ORDER: ComplianceState[] = ["APPROVED", "PENDING", "REJECTED", "EXPIRED", "MISSING"];

function allRequirements(detail: DriverComplianceDetail): RequirementStatus[] {
  return [...detail.driverRequirements, ...detail.vehicles.flatMap((vehicle) => vehicle.requirements)];
}

/**
 * O envio está esperando o admin: é o que a API põe na `reviewQueue` (pendente
 * e com arquivo). Um pendente sem arquivo espera o motorista, não o admin; a
 * regra é do back, e a tela só lê a fila dele.
 */
export function isAwaitingReview(detail: DriverComplianceDetail, submission: Submission | null): boolean {
  return submission != null && detail.reviewQueue.some((entry) => entry.token === submission.token);
}

/**
 * `5 aprovados · 2 pendentes · 1 reprovado`, só dos obrigatórios. Uma renovação
 * na fila de revisão, ao lado de uma aprovação, conta como pendente também.
 */
export function requirementsSummary(detail: DriverComplianceDetail): string {
  const required = allRequirements(detail).filter((item) => !item.optional);
  const counts = new Map<ComplianceState, number>();
  for (const item of required) {
    counts.set(item.state, (counts.get(item.state) ?? 0) + 1);
    if (item.state !== "PENDING" && isAwaitingReview(detail, item.pending)) {
      counts.set("PENDING", (counts.get("PENDING") ?? 0) + 1);
    }
  }
  return SUMMARY_ORDER.filter((state) => (counts.get(state) ?? 0) > 0)
    .map((state) => plural(page.summary[state], counts.get(state) ?? 0))
    .join(" · ");
}

export function vehicleDescription(vehicle: ComplianceVehicle): string | null {
  const model = [vehicle.brand, vehicle.model, vehicle.year].filter((part) => part != null && part !== "").join(" ");
  const capacity = vehicle.capacity != null ? plural(page.capacity, vehicle.capacity) : null;
  if (model && capacity) return interpolate(page.vehicleDescription, { model, capacity });
  return model || capacity;
}

/** O que identifica o envio que conta: número do documento ou categoria da CNH. */
export function requirementDetail(item: RequirementStatus): string {
  if (item.state === "MISSING") return item.optional ? page.optionalHint : page.notSent;
  const current = item.current;
  if (item.state === "REJECTED" && !item.pending) return page.awaitingResend;
  if (item.state === "PENDING" && current && current.fileUrl == null) return page.awaitingFile;
  if (current?.kind === "DRIVER_CNH") {
    return interpolate(page.cnhDetail, {
      category: current.category,
      number: current.registrationNumberMasked,
    });
  }
  if (current?.documentNumber) return interpolate(page.documentNumber, { number: current.documentNumber });
  return messages.noValue;
}

/**
 * A renovação ao lado de uma aprovação que ainda vale: em análise, se está na
 * fila do admin, ou esperando o motorista mandar o arquivo.
 */
export function renewalNote(detail: DriverComplianceDetail, item: RequirementStatus): string | null {
  if (!item.pending || item.state === "PENDING") return null;
  return isAwaitingReview(detail, item.pending) ? page.renewalPending : page.renewalAwaitingFile;
}

/** A validade do envio que conta. */
export function requirementExpiry(item: RequirementStatus, today: string): string | null {
  const current = item.current;
  if (!current?.expiresAt || item.state === "MISSING" || item.state === "REJECTED") return null;
  const date = formatDate(current.expiresAt);
  if (current.expiresAt < today) return interpolate(page.expiredOn, { date });
  if (current.kind === "DRIVER_CNH") return interpolate(page.validUntil, { date });
  return interpolate(page.expiresOn, { date });
}

/** O que um envio e uma última decisão têm em comum. */
type Decision = Pick<LastDecision, "status" | "rejectionReasonCode" | "reviewedBy" | "reviewedAt">;

function decisionText(template: string, decision: Decision): string | null {
  if (!decision.reviewedAt) return null;
  const text = interpolate(template, {
    status: messages.documentStatus[decision.status].toLowerCase(),
    actor: actorName(decision.reviewedBy),
    at: formatShortDateTime(decision.reviewedAt),
  });
  if (!decision.rejectionReasonCode) return text;
  return interpolate(page.lastDecisionReason, {
    decision: text,
    reason: messages.documentRejectionReason[decision.rejectionReasonCode],
  });
}

/**
 * A decisão que explica a linha:
 * - reprovado: quem reprovou o envio que conta, quando e por quê;
 * - pendente depois de um reenvio: a decisão do envio substituído.
 */
export function decisionNote(item: RequirementStatus): string | null {
  if (item.state === "REJECTED" && item.current) {
    return decisionText(page.rejectedBy, item.current);
  }
  if (item.state === "PENDING" && item.lastDecision) {
    return decisionText(page.lastDecision, item.lastDecision);
  }
  return null;
}

// ---------------------------------------------------------------- histórico

function documentInSentence(requirement: CredentialRequirement | null, plate: string | null): string {
  const document = requirement ? messages.requirementInSentence[requirement] : messages.noValue;
  return plate ? interpolate(page.documentOfVehicle, { document, plate: formatPlate(plate) }) : document;
}

export type HistoryLine = { title: string; meta: string; tone: "brand" | "success" | "danger" | "neutral" };

export function historyLine(event: HistoryEvent): HistoryLine {
  const document = documentInSentence(event.requirement, event.plate);
  const actor = actorName(event.actor);
  const title = interpolate(page.history[event.kind], { actor, document });
  const reason = historyReason(event);
  const at = formatShortDateTime(event.at);
  return {
    title,
    meta: reason ? `${at} · ${reason}` : at,
    tone: historyTone(event),
  };
}

function historyReason(event: HistoryEvent): string | null {
  const code = event.rejectionReasonCode;
  if (!code) return null;
  if (event.kind === "DRIVER_REJECTED") {
    return code in messages.driverRejectionReason
      ? messages.driverRejectionReason[code as keyof typeof messages.driverRejectionReason]
      : null;
  }
  return code in messages.documentRejectionReason
    ? messages.documentRejectionReason[code as keyof typeof messages.documentRejectionReason]
    : null;
}

function historyTone(event: HistoryEvent): HistoryLine["tone"] {
  switch (event.kind) {
    case "SUBMISSION_APPROVED":
    case "DRIVER_APPROVED":
      return "success";
    case "SUBMISSION_REJECTED":
    case "DRIVER_REJECTED":
      return "danger";
    case "ONBOARDING_SUBMITTED":
      return "brand";
    case "SUBMISSION_SENT":
      return "neutral";
  }
}
