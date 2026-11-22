import { interpolate, plural, t } from "@/lib/l10n";

import {
  daysBetween,
  expiryDistance,
  formatDate,
  formatInstantDate,
  formatShortDateTime,
  relativeDaysAgo,
} from "./format";
import type { ChipTone } from "./tone";
import type { DriverComplianceCounts, DriverComplianceRow, DriverComplianceView } from "./types";

const messages = t("admin").driverReview;
const queue = messages.queue;

export const QUEUE_VIEWS: readonly DriverComplianceView[] = [
  "AWAITING_DECISION",
  "PENDING_DOCUMENTS",
  "EXPIRING",
  "ALL",
];

/** A aba que abre por padrão: o trabalho do admin. */
export const DEFAULT_VIEW: DriverComplianceView = "AWAITING_DECISION";

/** A janela da aba "Vencidos e a vencer" na API (D17 a). */
export const EXPIRING_WINDOW_DAYS = 30;

export function parseView(value: string | null): DriverComplianceView {
  return QUEUE_VIEWS.find((view) => view === value) ?? DEFAULT_VIEW;
}

/** Página a partir de 0; qualquer valor inválido volta à primeira. */
export function parsePageIndex(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 0;
}

export type QueuePage = {
  content: DriverComplianceRow[];
  page: number;
  totalPages: number;
  totalElements: number;
};

/**
 * O `Page` do Spring serializado direto (`number`, `totalPages`) ou como DTO
 * (`page: {number, totalPages}`), o formato que o Spring Data recomenda.
 */
export function parseQueuePage(data: unknown): QueuePage {
  const raw = (data ?? {}) as {
    content?: DriverComplianceRow[];
    number?: number;
    totalPages?: number;
    totalElements?: number;
    page?: { number?: number; totalPages?: number; totalElements?: number };
  };
  return {
    content: raw.content ?? [],
    page: raw.page?.number ?? raw.number ?? 0,
    totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
    totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
  };
}

/** O número da aba. Em "Aguardando aprovação", só os que esperam o admin. */
export function viewCount(view: DriverComplianceView, counts: DriverComplianceCounts): number {
  switch (view) {
    case "AWAITING_DECISION":
      return counts.awaitingDecision - counts.awaitingDriver;
    case "PENDING_DOCUMENTS":
      return counts.pendingDocuments;
    case "EXPIRING":
      return counts.expiring;
    case "ALL":
      return counts.all;
  }
}

export type Chip = { tone: ChipTone; label: string };

/**
 * Um único chip por linha, com o que pede atenção primeiro:
 * vencido > pendente de revisão > vence em até 30 dias > reprovado > faltando > em dia.
 */
export function documentsChip(row: DriverComplianceRow, today: string): Chip {
  const docs = queue.documents;
  if (row.expiredCount > 0) {
    return { tone: "dangerSolid", label: plural(docs.expired, row.expiredCount) };
  }
  if (row.pendingReviewCount > 0) {
    return { tone: "warning", label: plural(docs.pending, row.pendingReviewCount) };
  }
  if (row.nextExpiryOn) {
    const days = daysBetween(today, row.nextExpiryOn);
    if (days >= 0 && days <= EXPIRING_WINDOW_DAYS) {
      const label = days === 0 ? docs.expiresToday : plural(docs.expiresIn, days);
      return { tone: "warningOutline", label };
    }
  }
  if (row.rejectedCount > 0) {
    return { tone: "danger", label: plural(docs.rejected, row.rejectedCount) };
  }
  if (row.missingCount > 0) {
    return { tone: "outline", label: plural(docs.missing, row.missingCount) };
  }
  if (row.nextAction === "READY_TO_APPROVE") return { tone: "success", label: docs.ready };
  return { tone: "success", label: docs.upToDate };
}

export type DateCell = { primary: string; secondary: string | null };

const EMPTY_DATE: DateCell = { primary: messages.noValue, secondary: null };

/** A coluna de data muda com a aba: a data que ordena a aba. */
export function dateCell(
  view: DriverComplianceView,
  row: DriverComplianceRow,
  today: string,
): DateCell {
  switch (view) {
    case "AWAITING_DECISION":
      return row.submittedAt
        ? { primary: relativeDaysAgo(row.submittedAt, today), secondary: formatShortDateTime(row.submittedAt) }
        : EMPTY_DATE;
    case "PENDING_DOCUMENTS":
      return row.oldestPendingAt
        ? {
            primary: relativeDaysAgo(row.oldestPendingAt, today),
            secondary: formatShortDateTime(row.oldestPendingAt),
          }
        : EMPTY_DATE;
    case "EXPIRING":
      return row.nextExpiryOn
        ? { primary: formatDate(row.nextExpiryOn), secondary: expiryDistance(row.nextExpiryOn, today) }
        : EMPTY_DATE;
    case "ALL":
      return {
        primary: formatInstantDate(row.createdAt),
        secondary: relativeDaysAgo(row.createdAt, today),
      };
  }
}

/**
 * Em "Aguardando aprovação" a API manda os que esperam o motorista no fim
 * (D17 a). A tela os separa numa seção própria; nas outras abas, nada muda.
 */
export function splitDriverTurn(
  view: DriverComplianceView,
  rows: DriverComplianceRow[],
): { adminTurn: DriverComplianceRow[]; driverTurn: DriverComplianceRow[] } {
  if (view !== "AWAITING_DECISION") return { adminTurn: rows, driverTurn: [] };
  return {
    adminTurn: rows.filter((row) => row.nextAction !== "DRIVER"),
    driverTurn: rows.filter((row) => row.nextAction === "DRIVER"),
  };
}

/** O resumo embaixo da lista. Com busca, o total da busca; sem, o da aba. */
export function queueFooter(
  view: DriverComplianceView,
  search: string,
  totalElements: number,
  counts: DriverComplianceCounts | null,
): string {
  const footer = queue.footer;
  if (search) return plural(footer.search, totalElements, { q: search });
  if (view === "AWAITING_DECISION") {
    if (!counts) return "";
    return interpolate(footer.AWAITING_DECISION, {
      mine: counts.awaitingDecision - counts.awaitingDriver,
      driver: counts.awaitingDriver,
    });
  }
  return plural(footer[view], totalElements);
}

/** Iniciais do avatar: primeira letra do primeiro e do último nome. */
export function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
