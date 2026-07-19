"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/lib/l10n";

const messages = t("admin").drivers;

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

type Driver = {
  token: string;
  name: string | null;
  email: string | null;
  city: string | null;
  experienceYears: number | null;
  rating: number | null;
  approvalStatus: ApprovalStatus;
  available: boolean;
  createdAt: string | null;
};

type DriversPage = {
  content: Driver[];
  page: number;
  totalPages: number;
  totalElements: number;
};

const PAGE_SIZE = 10;

function parsePage(data: unknown): DriversPage {
  const raw = data as {
    content?: Driver[];
    number?: number;
    totalPages?: number;
    totalElements?: number;
    page?: { number?: number; totalPages?: number; totalElements?: number };
  };
  return {
    content: raw.content ?? [],
    page: raw.number ?? raw.page?.number ?? 0,
    totalPages: raw.totalPages ?? raw.page?.totalPages ?? 1,
    totalElements: raw.totalElements ?? raw.page?.totalElements ?? 0,
  };
}

function formatDate(value: string | null): string {
  if (!value) return messages.noValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return messages.noValue;
  return date.toLocaleDateString("pt-BR");
}

function approvalClass(status: ApprovalStatus): string {
  if (status === "APPROVED") {
    return "rounded-full bg-brand/20 px-2.5 py-1 text-xs font-semibold text-brand";
  }
  if (status === "REJECTED") {
    return "rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300";
  }
  return "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground";
}

export default function AdminDriversPage() {
  const [data, setData] = useState<DriversPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDrivers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drivers?page=${targetPage}&size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData(parsePage(await res.json()));
    } catch {
      setError(messages.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers(page);
  }, [page, loadDrivers]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/drivers/${encodeURIComponent(deleteTarget.token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDeleteTarget(null);
      await loadDrivers(page);
    } catch {
      setError(messages.deleteError);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <section>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">{messages.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{messages.description}</p>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadDrivers(page)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {messages.retry}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]/60">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{messages.columns.name}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.email}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.city}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.experience}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.rating}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.approval}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.availability}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.empty}
                </td>
              </tr>
            )}
            {!loading &&
              data?.content.map((driver) => (
                <tr
                  key={driver.token}
                  className="border-b border-[var(--border)]/50 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {driver.name ?? messages.noName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{driver.email ?? messages.noValue}</td>
                  <td className="px-4 py-3 text-muted-foreground">{driver.city ?? messages.noValue}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {driver.experienceYears != null
                      ? messages.experienceYears.replace("{years}", String(driver.experienceYears))
                      : messages.noValue}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {driver.rating != null ? Number(driver.rating).toFixed(1) : messages.noValue}
                  </td>
                  <td className="px-4 py-3">
                    <span className={approvalClass(driver.approvalStatus)}>
                      {messages.approvalStatus[driver.approvalStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        driver.available
                          ? "rounded-full bg-brand/20 px-2.5 py-1 text-xs font-semibold text-brand"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                      }
                    >
                      {driver.available ? messages.available : messages.unavailable}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(driver.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(driver)}
                      className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      {messages.delete}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{messages.totalInfo.replace("{total}", String(data?.totalElements ?? 0))}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loading || page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {messages.previous}
          </button>
          <span>
            {messages.pageInfo
              .replace("{page}", String(page + 1))
              .replace("{total}", String(Math.max(totalPages, 1)))}
          </span>
          <button
            type="button"
            disabled={loading || page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {messages.next}
          </button>
        </div>
      </footer>

      <ConfirmDialog
        open={deleteTarget != null}
        title={messages.deleteTitle}
        description={messages.deleteDescription}
        confirmLabel={messages.delete}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
