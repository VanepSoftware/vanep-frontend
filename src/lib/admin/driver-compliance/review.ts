import { interpolate, t } from "@/lib/l10n";

import { formatCpf, formatPlate, maskCpf, vehicleDescription } from "./driver-page";
import { expiryDistance, formatDate, formatDateTime, formatShortDateTime } from "./format";
import type {
  ComplianceVehicle,
  DriverComplianceDetail,
  RequirementStatus,
  ReviewQueueItem,
  Submission,
  SubmissionKind,
  UserRef,
} from "./types";

const messages = t("admin").driverReview;
const review = messages.review;

// ---------------------------------------------------------------- rotas

/** O tipo do envio na URL da tela é o nome do recurso na API. */
const KIND_SLUG: Record<SubmissionKind, string> = {
  DRIVER_DOCUMENT: "driver-documents",
  VEHICLE_DOCUMENT: "vehicle-documents",
  DRIVER_CNH: "driver-cnhs",
};

export function parseKindSlug(slug: string): SubmissionKind | null {
  const entry = Object.entries(KIND_SLUG).find(([, value]) => value === slug);
  return entry ? (entry[0] as SubmissionKind) : null;
}

/** A entrada da revisão: abre o primeiro pendente, ou a tela de fim. */
export function reviewEntryHref(driverToken: string): string {
  return `/admin/drivers/${encodeURIComponent(driverToken)}/review`;
}

export function reviewHref(driverToken: string, kind: SubmissionKind, submissionToken: string): string {
  return `${reviewEntryHref(driverToken)}/${KIND_SLUG[kind]}/${encodeURIComponent(submissionToken)}`;
}

export function driverHref(driverToken: string): string {
  return `/admin/drivers/${encodeURIComponent(driverToken)}`;
}

// ---------------------------------------------------------------- o envio na página

export type FoundSubmission = {
  submission: Submission;
  item: RequirementStatus;
  vehicle: ComplianceVehicle | null;
};

/**
 * Acha o envio na página do motorista: o que conta ou a renovação pendente de
 * algum requisito. Um envio substituído não está mais lá e dá `null`.
 */
export function findSubmission(
  detail: DriverComplianceDetail,
  kind: SubmissionKind,
  token: string,
): FoundSubmission | null {
  const matches = (submission: Submission | null): submission is Submission =>
    submission != null && submission.kind === kind && submission.token === token;

  const search = (items: RequirementStatus[], vehicle: ComplianceVehicle | null): FoundSubmission | null => {
    for (const item of items) {
      if (matches(item.pending)) return { submission: item.pending, item, vehicle };
      if (matches(item.current)) return { submission: item.current, item, vehicle };
    }
    return null;
  };

  if (kind !== "VEHICLE_DOCUMENT") {
    const found = search(detail.driverRequirements, null);
    if (found) return found;
  }
  for (const vehicle of detail.vehicles) {
    const found = search(vehicle.requirements, vehicle);
    if (found) return found;
  }
  return null;
}

/** O envio que a linha do checklist abre: a renovação pendente, se há, ou o que conta. */
export function rowSubmission(item: RequirementStatus): Submission | null {
  return item.pending ?? item.current;
}

export type QueuePosition = {
  position: number;
  total: number;
  previous: ReviewQueueItem | null;
  next: ReviewQueueItem | null;
};

/** Onde o envio está no "pendente 1 de N"; `null` se ele não está pendente. */
export function queuePosition(
  detail: DriverComplianceDetail,
  kind: SubmissionKind,
  token: string,
): QueuePosition | null {
  const queue = detail.reviewQueue;
  const index = queue.findIndex((item) => item.kind === kind && item.token === token);
  if (index < 0) return null;
  return {
    position: index + 1,
    total: queue.length,
    previous: index > 0 ? queue[index - 1] : null,
    next: index < queue.length - 1 ? queue[index + 1] : null,
  };
}

// ---------------------------------------------------------------- arquivo

export type ViewerKind = "image" | "pdf" | "other";

export function viewerKind(mimeType: string | null | undefined): ViewerKind {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** `412 KB`, `1,2 MB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return interpolate(review.sizes.bytes, { value: bytes });
  if (bytes < 1024 * 1024) return interpolate(review.sizes.kb, { value: Math.round(bytes / 1024) });
  return interpolate(review.sizes.mb, { value: decimal.format(bytes / (1024 * 1024)) });
}

/** Os passos do zoom de imagem, em porcentagem. */
export const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 300] as const;

/** O próximo passo acima ou abaixo do zoom atual, parando nas pontas. */
export function nextZoom(current: number, direction: 1 | -1): number {
  if (direction === 1) return ZOOM_STEPS.find((step) => step > current) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  return [...ZOOM_STEPS].reverse().find((step) => step < current) ?? ZOOM_STEPS[0];
}

// ---------------------------------------------------------------- dados ao lado do arquivo

export type Fact = { label: string; value: string; hint?: string };

/** O que o motorista informou no envio. */
export function submissionFacts(found: FoundSubmission, today: string): Fact[] {
  const { submission, item } = found;
  const facts: Fact[] = [{ label: review.facts.type, value: messages.requirement[item.requirement] }];

  if (submission.kind === "DRIVER_CNH") {
    facts.push(
      { label: review.facts.category, value: submission.category },
      { label: review.facts.registration, value: submission.registrationNumberMasked },
    );
    if (submission.issueDate) facts.push({ label: review.facts.issueDate, value: formatDate(submission.issueDate) });
  } else if (submission.documentNumber) {
    facts.push({ label: review.facts.number, value: submission.documentNumber });
  }

  if (submission.expiresAt) {
    facts.push({
      label: submission.kind === "DRIVER_CNH" ? review.facts.validUntil : review.facts.expiresAt,
      value: formatDate(submission.expiresAt),
      hint: expiryDistance(submission.expiresAt, today),
    });
  }

  facts.push({
    label: review.facts.sentAt,
    value: formatDateTime(submission.createdAt),
    hint: review.facts.byDriver,
  });
  return facts;
}

/** O que conferir no arquivo contra o cadastro: o motorista ou a van. */
export function registrationChecks(
  detail: DriverComplianceDetail,
  found: FoundSubmission,
  revealDocument: boolean,
): Fact[] {
  if (found.vehicle) {
    const facts: Fact[] = [{ label: review.checks.plate, value: formatPlate(found.vehicle.plate) }];
    const description = vehicleDescription(found.vehicle);
    if (description) facts.push({ label: review.checks.model, value: description });
    return facts;
  }
  const { driver } = detail;
  const facts: Fact[] = [{ label: review.checks.name, value: driver.name ?? messages.noName }];
  if (driver.document) {
    facts.push({
      label: review.checks.document,
      value: revealDocument ? formatCpf(driver.document) : maskCpf(driver.document),
    });
  }
  if (driver.birthDate) facts.push({ label: review.checks.birthDate, value: formatDate(driver.birthDate) });
  return facts;
}

function actor(user: UserRef | null): string {
  return user?.name ?? messages.driver.someone;
}

/** A decisão de um envio já revisado (ou da última decisão do requisito). */
export function decisionLine(decision: {
  status: Submission["status"];
  reviewedBy: UserRef | null;
  reviewedAt: string | null;
  rejectionReasonCode: Submission["rejectionReasonCode"];
  rejectionReason: string | null;
}): { title: string; reason: string | null } | null {
  if (decision.status === "PENDING" || !decision.reviewedAt) return null;
  const template = decision.status === "APPROVED" ? review.approvedBy : review.rejectedBy;
  const title = interpolate(template, {
    actor: actor(decision.reviewedBy),
    at: formatShortDateTime(decision.reviewedAt),
  });
  if (decision.status !== "REJECTED" || !decision.rejectionReasonCode) return { title, reason: null };
  const label = messages.documentRejectionReason[decision.rejectionReasonCode];
  const reason =
    decision.rejectionReasonCode === "OTHER"
      ? decision.rejectionReason ?? label
      : [label, decision.rejectionReason].filter(Boolean).join(" · ");
  return { title, reason };
}
