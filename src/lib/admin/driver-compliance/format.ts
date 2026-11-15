import { interpolate, t } from "@/lib/l10n";

import type { IsoDate, IsoDateTime } from "./types";

const time = t("admin").driverReview.time;

/** As datas de serviço da API são de São Paulo (D15 da VAN-86); a tela mostra no mesmo fuso. */
const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

const isoDateInSaoPaulo = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dayMonthFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDate(date: IsoDate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`not an ISO date: ${date}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** A data de hoje em São Paulo, para quando a resposta não traz o `asOf`. */
export function todayInSaoPaulo(now: Date = new Date()): IsoDate {
  return isoDateInSaoPaulo.format(now);
}

/** O dia de um instante em São Paulo. */
export function dateInSaoPaulo(instant: IsoDateTime): IsoDate {
  return isoDateInSaoPaulo.format(new Date(instant));
}

/** `2027-02-14` → `14/02/2027`, sem passar por fuso: a data já é do dia certo. */
export function formatDate(date: IsoDate): string {
  const match = ISO_DATE.exec(date);
  if (!match) return date;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** `11/11/2026` de um instante, em São Paulo. */
export function formatInstantDate(instant: IsoDateTime): string {
  return dateFormat.format(new Date(instant));
}

/** `11/11/2026 às 09:12`. */
export function formatDateTime(instant: IsoDateTime): string {
  const date = new Date(instant);
  return interpolate(time.at, { date: dateFormat.format(date), time: timeFormat.format(date) });
}

/** `11/11 · 09:12`, para listas com datas próximas. */
export function formatShortDateTime(instant: IsoDateTime): string {
  const date = new Date(instant);
  return `${dayMonthFormat.format(date)} · ${timeFormat.format(date)}`;
}

/** Dias de `from` até `to` (negativo se `to` já passou). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / DAY_MS);
}

/** "hoje", "ontem" ou "há N dias", contando dias do calendário de São Paulo. */
export function relativeDaysAgo(instant: IsoDateTime, today: IsoDate): string {
  const days = daysBetween(dateInSaoPaulo(instant), today);
  if (days <= 0) return time.today;
  if (days === 1) return time.yesterday;
  return interpolate(time.daysAgo, { days });
}

/** "vence hoje", "vence amanhã", "vence em N dias", "venceu ontem" ou "venceu há N dias". */
export function expiryDistance(expiresAt: IsoDate, today: IsoDate): string {
  const days = daysBetween(today, expiresAt);
  if (days === 0) return time.expiresToday;
  if (days === 1) return time.expiresTomorrow;
  if (days > 1) return interpolate(time.expiresIn, { days });
  if (days === -1) return time.expiredYesterday;
  return interpolate(time.expiredDaysAgo, { days: -days });
}
