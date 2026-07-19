"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/lib/l10n";

const messages = t("admin").permissions;

type Bundle = {
  token: string;
  name: string;
  permissions: string[];
  createdAt: string | null;
};

type BundlesPage = {
  content: Bundle[];
  page: number;
  totalPages: number;
  totalElements: number;
};

const PAGE_SIZE = 20;

function parsePage(data: unknown): BundlesPage {
  const raw = data as {
    content?: Bundle[];
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

export default function AdminPermissionsPage() {
  const [data, setData] = useState<BundlesPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);

  const [editing, setEditing] = useState<Bundle | "new" | null>(null);
  const [formName, setFormName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBundles = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/role-permissions?page=${targetPage}&size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData(parsePage(await res.json()));
    } catch {
      setError(messages.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) throw new Error(`status ${res.status}`);
      setAllPermissions((await res.json()) as string[]);
    } catch {
      setError(messages.loadError);
    }
  }, []);

  useEffect(() => {
    void loadBundles(page);
  }, [page, loadBundles]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  function openCreate() {
    setEditing("new");
    setFormName("");
    setSelected(new Set());
    setFormError(null);
  }

  function openEdit(bundle: Bundle) {
    setEditing(bundle);
    setFormName(bundle.name);
    setSelected(new Set(bundle.permissions));
    setFormError(null);
  }

  function togglePermission(permission: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  async function saveBundle(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!editing) return;
    if (!formName.trim()) {
      setFormError(messages.nameRequired);
      return;
    }
    if (selected.size === 0) {
      setFormError(messages.permissionsRequired);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = JSON.stringify({
      name: formName.trim(),
      permissions: Array.from(selected),
    });
    const url =
      editing === "new"
        ? "/api/admin/role-permissions"
        : `/api/admin/role-permissions/${encodeURIComponent(editing.token)}`;
    try {
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (!res.ok) {
        setFormError(res.status === 409 ? messages.conflict : messages.saveError);
        return;
      }
      setEditing(null);
      await loadBundles(page);
    } catch {
      setFormError(messages.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/role-permissions/${encodeURIComponent(deleteTarget.token)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDeleteTarget(null);
      await loadBundles(page);
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
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{messages.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.description}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
        >
          {messages.new}
        </button>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadBundles(page)}
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
              <th className="px-4 py-3 font-medium">{messages.columns.permissions}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.empty}
                </td>
              </tr>
            )}
            {!loading &&
              data?.content.map((bundle) => (
                <tr
                  key={bundle.token}
                  className="border-b border-[var(--border)]/50 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{bundle.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {messages.selectedCount.replace("{count}", String(bundle.permissions.length))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(bundle.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(bundle)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
                      >
                        {messages.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(bundle)}
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

      {editing != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editing === "new" ? messages.createTitle : messages.editTitle}
        >
          <form
            onSubmit={(event) => void saveBundle(event)}
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl"
          >
            <h2 className="font-display text-lg font-bold text-foreground">
              {editing === "new" ? messages.createTitle : messages.editTitle}
            </h2>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.nameLabel}
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                maxLength={64}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{messages.permissionsLabel}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  {messages.selectedCount.replace("{count}", String(selected.size))}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set(allPermissions))}
                  className="font-semibold text-brand hover:underline"
                >
                  {messages.selectAll}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="font-semibold text-muted-foreground hover:underline"
                >
                  {messages.clearAll}
                </button>
              </div>
            </div>

            <div className="mt-2 grid flex-1 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background-deep)] p-3 sm:grid-cols-2">
              {allPermissions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-brand/10"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  <span className="font-mono text-xs">{permission}</span>
                </label>
              ))}
            </div>

            {formError && <p className="mt-3 text-sm text-red-300">{formError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
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
