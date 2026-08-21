"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/lib/l10n";

const messages = t("admin").clients;
const common = t("common");

type ClientAddress = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  cityName?: string | null;
  stateUf?: string | null;
};

type Client = {
  token: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  rating: number | null;
  active: boolean;
  createdAt: string | null;
  address?: ClientAddress | null;
};

type ClientsPage = {
  content: Client[];
  page: number;
  totalPages: number;
  totalElements: number;
};

const PAGE_SIZE = 10;

function parsePage(data: unknown): ClientsPage {
  const raw = data as {
    content?: Client[];
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
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function formatZipCode(zipCode: string): string {
  const digits = zipCode.replace(/\D/g, "");
  if (digits.length !== 8) return zipCode;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function compactAddress(address: ClientAddress | null | undefined): string {
  if (!address) return messages.noAddress;
  const line = [address.street, address.number].filter(Boolean).join(", ");
  const city = [address.cityName, address.stateUf].filter(Boolean).join("/");
  return [line, city].filter(Boolean).join(" · ") || messages.noAddress;
}

function addressLines(address: ClientAddress): string[] {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const city = [address.cityName, address.stateUf].filter(Boolean).join("/");
  const zip = address.zipCode ? formatZipCode(address.zipCode) : "";
  return [street, address.complement, address.neighborhood, city, zip].filter(
    (part): part is string => Boolean(part),
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

export default function AdminClientsPage() {
  const [data, setData] = useState<ClientsPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState<Client | null>(null);

  const loadClients = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients?page=${targetPage}&size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData(parsePage(await res.json()));
    } catch {
      setError(messages.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients(page);
  }, [page, loadClients]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${encodeURIComponent(deleteTarget.token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDeleteTarget(null);
      setViewTarget(null);
      await loadClients(page);
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
            onClick={() => void loadClients(page)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {messages.retry}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{messages.columns.name}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.email}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.address}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.rating}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.status}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.empty}
                </td>
              </tr>
            )}
            {!loading &&
              data?.content.map((client) => (
                <tr
                  key={client.token}
                  className="border-b border-[var(--border)]/50 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {client.name ?? messages.noName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email ?? "—"}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-muted-foreground">
                    {compactAddress(client.address)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.rating != null ? Number(client.rating).toFixed(1) : messages.noRating}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        client.active
                          ? "rounded-full bg-brand/20 px-2.5 py-1 text-xs font-semibold text-brand"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                      }
                    >
                      {client.active ? messages.active : messages.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setViewTarget(client)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
                      >
                        {messages.view}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(client)}
                        className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                      >
                        {messages.delete}
                      </button>
                    </div>
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

      {viewTarget != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={messages.viewTitle}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-foreground">
              {messages.viewTitle}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">{messages.viewHint}</p>

            <dl className="mt-4 divide-y divide-[var(--border)]/60">
              <DetailRow label={messages.nameLabel}>
                {viewTarget.name ?? messages.noName}
              </DetailRow>
              <DetailRow label={messages.emailLabel}>{viewTarget.email ?? "—"}</DetailRow>
              <DetailRow label={messages.photoLabel}>
                {viewTarget.photo ? (
                  <a
                    href={viewTarget.photo}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-brand underline-offset-2 hover:underline"
                  >
                    {viewTarget.photo}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label={messages.ratingLabel}>
                {viewTarget.rating != null
                  ? Number(viewTarget.rating).toFixed(1)
                  : messages.noRating}
              </DetailRow>
              <DetailRow label={messages.statusLabel}>
                {viewTarget.active ? messages.active : messages.inactive}
              </DetailRow>
              <DetailRow label={messages.addressLabel}>
                {viewTarget.address && addressLines(viewTarget.address).length > 0 ? (
                  <span className="block whitespace-pre-line">
                    {addressLines(viewTarget.address).join("\n")}
                  </span>
                ) : (
                  messages.noAddress
                )}
              </DetailRow>
              <DetailRow label={messages.createdAtLabel}>
                {formatDate(viewTarget.createdAt)}
              </DetailRow>
            </dl>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-80"
              >
                {common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
