"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/lib/l10n";

const messages = t("admin").clients;

type Client = {
  token: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  rating: number | null;
  active: boolean;
  createdAt: string | null;
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

export default function AdminClientsPage() {
  const [data, setData] = useState<ClientsPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editRating, setEditRating] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

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

  function openEdit(client: Client) {
    setEditTarget(client);
    setEditName(client.name ?? "");
    setEditEmail(client.email ?? "");
    setEditPhoto(client.photo ?? "");
    setEditRating(client.rating != null ? String(client.rating) : "");
    setEditActive(client.active);
  }

  async function saveEdit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${encodeURIComponent(editTarget.token)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || null,
          email: editEmail.trim() || null,
          photo: editPhoto.trim() || null,
          rating: editRating.trim() ? Number(editRating) : null,
          active: editActive,
        }),
      });
      if (!res.ok) {
        setError(res.status === 409 ? messages.editConflict : messages.editError);
        setEditTarget(null);
        return;
      }
      setEditTarget(null);
      await loadClients(page);
    } catch {
      setError(messages.editError);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${encodeURIComponent(deleteTarget.token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDeleteTarget(null);
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
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{messages.columns.name}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.email}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.rating}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.status}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
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
                        onClick={() => openEdit(client)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
                      >
                        {messages.edit}
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

      {editTarget != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={messages.editTitle}
        >
          <form
            onSubmit={(event) => void saveEdit(event)}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl"
          >
            <h2 className="font-display text-lg font-bold text-foreground">
              {messages.editTitle}
            </h2>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.nameLabel}
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={255}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.emailLabel}
              <input
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                maxLength={255}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.photoLabel}
              <input
                type="url"
                value={editPhoto}
                onChange={(event) => setEditPhoto(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.ratingLabel}
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={editRating}
                onChange={(event) => setEditRating(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(event) => setEditActive(event.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              {messages.activeLabel}
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={saving}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {t("common").cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? t("common").loading : messages.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
