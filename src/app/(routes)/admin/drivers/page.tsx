"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useDriverReviewCounts } from "@/components/admin/driver-review-counts";
import { Chip } from "@/components/ui/chip";
import { todayInSaoPaulo } from "@/lib/admin/driver-compliance/format";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import {
  DEFAULT_VIEW,
  QUEUE_VIEWS,
  dateCell,
  documentsChip,
  initials,
  parsePageIndex,
  parseQueuePage,
  parseView,
  queueFooter,
  splitDriverTurn,
  viewCount,
} from "@/lib/admin/driver-compliance/queue";
import { approvalStatusTone } from "@/lib/admin/driver-compliance/tone";
import type { DriverComplianceRow, DriverComplianceView } from "@/lib/admin/driver-compliance/types";
import { ApiProblemError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";
import { interpolate, t } from "@/lib/l10n";

const messages = t("admin").driverReview;
const queue = messages.queue;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const ROW_GRID =
  "grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_150px_170px_56px_130px_24px] items-center gap-4 px-5";

function errorMessage(error: unknown): string {
  return error instanceof ApiProblemError ? problemMessage(error.problem) : queue.loadError;
}

export default function DriverQueuePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{queue.loading}</p>}>
      <DriverQueue />
    </Suspense>
  );
}

type QueueQuery = { view: DriverComplianceView; q: string; page: number };

/** A URL da fila. A aba padrão, a busca vazia e a primeira página ficam de fora. */
function queueHref(pathname: string, query: QueueQuery): string {
  const params = new URLSearchParams();
  if (query.view !== DEFAULT_VIEW) params.set("view", query.view);
  if (query.q) params.set("q", query.q);
  if (query.page > 0) params.set("page", String(query.page));
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

/** Lê a aba, a busca e a página da URL, para o voltar do navegador manter o lugar. */
function useQueueParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view = parseView(searchParams.get("view"));
  const search = (searchParams.get("q") ?? "").trim();
  const page = parsePageIndex(searchParams.get("page"));

  /** Aba e página entram no histórico; a busca, digitada letra a letra, substitui. */
  const hrefFor = useCallback(
    (next: Partial<QueueQuery>) =>
      queueHref(pathname, { view: next.view ?? view, q: next.q ?? search, page: next.page ?? 0 }),
    [pathname, search, view],
  );
  const goToPage = useCallback(
    (next: number) => router.push(hrefFor({ page: next }), { scroll: false }),
    [hrefFor, router],
  );
  const replaceSearch = useCallback(
    (q: string) => router.replace(hrefFor({ q }), { scroll: false }),
    [hrefFor, router],
  );
  const replacePage = useCallback(
    (next: number) => router.replace(hrefFor({ page: next }), { scroll: false }),
    [hrefFor, router],
  );

  return { view, search, page, hrefFor, goToPage, replaceSearch, replacePage };
}

function DriverQueue() {
  const { view, search, page, hrefFor, goToPage, replaceSearch, replacePage } = useQueueParams();
  const { counts, ensureFresh } = useDriverReviewCounts();

  // As abas mostram as contagens; ao abrir a fila, elas não podem ser de outra hora.
  useEffect(() => ensureFresh(), [ensureFresh]);

  const params = new URLSearchParams({ view, page: String(page), size: String(PAGE_SIZE) });
  if (search) params.set("q", search);
  const { state, reload } = useJsonResource<unknown>(`/api/admin/drivers/compliance?${params}`);
  const data = useMemo(
    () => (state.status === "ready" ? parseQueuePage(state.data) : null),
    [state],
  );

  // A página pedida deixou de existir (a fila andou): vai para a última.
  const lastPage = data ? Math.max(data.totalPages - 1, 0) : 0;
  useEffect(() => {
    if (data && page > lastPage) replacePage(lastPage);
  }, [data, page, lastPage, replacePage]);

  const today = counts?.asOf ?? todayInSaoPaulo();

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{queue.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{queue.description}</p>
        </div>
        <SearchBox initial={search} onSearch={replaceSearch} />
      </header>

      <nav aria-label={queue.tabsLabel} className="mb-4 flex flex-wrap gap-2">
        {QUEUE_VIEWS.map((tab) => (
          <QueueTab
            key={tab}
            selected={tab === view}
            label={queue.views[tab]}
            count={counts ? viewCount(tab, counts) : null}
            href={hrefFor({ view: tab })}
          />
        ))}
      </nav>

      {state.status === "error" ? (
        <div className="flex items-center justify-between rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          <span>{errorMessage(state.error)}</span>
          <button
            type="button"
            onClick={reload}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {messages.retry}
          </button>
        </div>
      ) : (
        <div>
          <QueueTable
            view={view}
            search={search}
            today={today}
            rows={data ? data.content : null}
          />
          {data && (
            <QueueFooter
              text={queueFooter(view, search, data.totalElements, counts)}
              page={data.page}
              totalPages={data.totalPages}
              onPage={goToPage}
            />
          )}
        </div>
      )}
    </section>
  );
}

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  const [syncedInitial, setSyncedInitial] = useState(initial);

  // A URL mudou por fora (voltar do navegador): o campo acompanha, sem perder o foco.
  if (initial !== syncedInitial) {
    setSyncedInitial(initial);
    if (value.trim() !== initial) setValue(initial);
  }

  useEffect(() => {
    const q = value.trim();
    if (q === initial) return;
    const timer = setTimeout(() => onSearch(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, initial, onSearch]);

  return (
    <label className="flex h-10 w-80 max-w-full items-center gap-2 rounded-[10px] border border-border bg-background px-3 text-sm text-muted-foreground focus-within:border-brand">
      <SearchIcon />
      <span className="sr-only">{queue.searchLabel}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={queue.searchPlaceholder}
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
      />
    </label>
  );
}

function QueueTab({
  selected,
  label,
  count,
  href,
}: {
  selected: boolean;
  label: string;
  count: number | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "page" : undefined}
      className={`inline-flex h-10 items-center gap-2 rounded-[10px] border px-3.5 text-sm font-medium transition-colors duration-150 ${
        selected
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-background text-foreground hover:border-border-strong"
      }`}
    >
      {label}
      {count != null && (
        <span
          className={`inline-flex h-5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
            selected ? "bg-background text-brand" : "bg-background-soft text-brand-strong"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function QueueTable({
  view,
  search,
  today,
  rows,
}: {
  view: DriverComplianceView;
  search: string;
  today: string;
  rows: DriverComplianceRow[] | null;
}) {
  const { adminTurn, driverTurn } = splitDriverTurn(view, rows ?? []);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <div className="min-w-220">
        <div
          className={`${ROW_GRID} border-b border-border py-3 text-[13px] font-medium text-muted-foreground`}
        >
          <span>{queue.columns.driver}</span>
          <span>{queue.columns.city}</span>
          <span>{queue.columns.registration}</span>
          <span>{queue.columns.documents}</span>
          <span>{queue.columns.vehicles}</span>
          <span>{queue.dateColumn[view]}</span>
          <span />
        </div>

        {rows == null && <p className="px-5 py-10 text-center text-sm text-muted-foreground">{queue.loading}</p>}

        {rows != null && rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {search ? interpolate(queue.empty.search, { q: search }) : queue.empty[view]}
          </p>
        )}

        <ul>
          {adminTurn.map((row) => (
            <QueueRow key={row.token} row={row} view={view} today={today} />
          ))}
        </ul>

        {driverTurn.length > 0 && (
          <>
            <div className="flex items-center gap-2 border-b border-border/60 bg-background-deep px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ClockIcon />
              {queue.driverTurn}
            </div>
            <ul>
              {driverTurn.map((row) => (
                <QueueRow key={row.token} row={row} view={view} today={today} muted />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function QueueRow({
  row,
  view,
  today,
  muted = false,
}: {
  row: DriverComplianceRow;
  view: DriverComplianceView;
  today: string;
  muted?: boolean;
}) {
  const docs = documentsChip(row, today);
  const date = dateCell(view, row, today);

  return (
    <li>
      <Link
        href={`/admin/drivers/${encodeURIComponent(row.token)}`}
        className={`${ROW_GRID} border-b border-border/60 py-3.5 text-foreground transition-colors duration-150 hover:bg-background-deep`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-semibold ${
              muted ? "bg-muted text-muted-foreground" : "bg-background-soft text-brand-strong"
            }`}
          >
            {initials(row.name)}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{row.name ?? messages.noName}</span>
            <span className="block truncate text-[13px] text-muted-foreground">
              {row.email ?? messages.noValue}
            </span>
          </span>
        </span>
        <span className="truncate text-sm text-muted-foreground">{row.city ?? messages.noValue}</span>
        <span>
          <Chip tone={approvalStatusTone(row.approvalStatus)}>
            {messages.approvalStatus[row.approvalStatus]}
          </Chip>
        </span>
        <span>
          <Chip tone={docs.tone}>{docs.label}</Chip>
        </span>
        <span className="text-sm text-muted-foreground">{row.vehicleCount}</span>
        <span className="text-[13px] text-muted-foreground">
          <span className="block font-medium text-foreground">{date.primary}</span>
          {date.secondary}
        </span>
        <ChevronIcon />
      </Link>
    </li>
  );
}

function QueueFooter({
  text,
  page,
  totalPages,
  onPage,
}: {
  text: string;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(totalPages, 1);
  const button =
    "h-[34px] rounded-lg border border-border bg-background px-3 text-foreground transition-colors duration-150 hover:border-border-strong hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

  return (
    <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{text}</span>
      {pages > 1 && (
        <span className="flex items-center gap-3">
          <button type="button" className={button} disabled={page === 0} onClick={() => onPage(page - 1)}>
            {messages.previous}
          </button>
          <span>{interpolate(messages.pageInfo, { page: page + 1, total: pages })}</span>
          <button
            type="button"
            className={button}
            disabled={page + 1 >= pages}
            onClick={() => onPage(page + 1)}
          >
            {messages.next}
          </button>
        </span>
      )}
    </footer>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4.5 w-4.5 text-border-strong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
