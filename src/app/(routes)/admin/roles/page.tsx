"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/lib/l10n";

const messages = t("admin").roles;

type Bundle = { token: string; name: string };

type Role = {
  token: string;
  name: string;
  description: string | null;
  rolePermission: { token: string; name: string } | null;
  createdAt: string | null;
};

type RolesPage = {
  content: Role[];
  page: number;
  totalPages: number;
  totalElements: number;
};

const PAGE_SIZE = 20;

function parsePage(data: unknown): RolesPage {
  const raw = data as {
    content?: Role[];
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

export default function AdminRolesPage() {
  const [data, setData] = useState<RolesPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBundle, setFormBundle] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRoles = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles?page=${targetPage}&size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData(parsePage(await res.json()));
    } catch {
      setError(messages.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBundles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/role-permissions?page=0&size=100");
      if (!res.ok) throw new Error(`status ${res.status}`);
      setBundles(parsePage(await res.json()).content as unknown as Bundle[]);
    } catch {
      setError(messages.loadError);
    }
  }, []);

  useEffect(() => {
    void loadRoles(page);
  }, [page, loadRoles]);

  useEffect(() => {
    void loadBundles();
  }, [loadBundles]);

  function openCreate() {
    setEditing("new");
    setFormName("");
    setFormDescription("");
    setFormBundle("");
    setFormError(null);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setFormName(role.name);
    setFormDescription(role.description ?? "");
    setFormBundle(role.rolePermission?.token ?? "");
    setFormError(null);
  }

  async function saveRole(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!editing) return;
    if (!formName.trim()) {
      setFormError(messages.nameRequired);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = JSON.stringify({
      name: formName.trim(),
      description: formDescription.trim() || null,
      rolePermissionToken: formBundle || null,
    });
    const url =
      editing === "new" ? "/api/admin/roles" : `/api/admin/roles/${encodeURIComponent(editing.token)}`;
    try {
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (!res.ok) {
        setFormError(messages.saveError);
        return;
      }
      setEditing(null);
      await loadRoles(page);
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
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(deleteTarget.token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDeleteTarget(null);
      await loadRoles(page);
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
            onClick={() => void loadRoles(page)}
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
              <th className="px-4 py-3 font-medium">{messages.columns.description}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.bundle}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.empty}
                </td>
              </tr>
            )}
            {!loading &&
              data?.content.map((role) => (
                <tr key={role.token} className="border-b border-[var(--border)]/50 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{role.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role.description ?? "—"}</td>
                  <td className="px-4 py-3">
                    {role.rolePermission ? (
                      <span className="rounded-full bg-brand/20 px-2.5 py-1 text-xs font-semibold text-brand">
                        {role.rolePermission.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{messages.noBundle}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(role.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
                      >
                        {messages.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(role)}
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
            onSubmit={(event) => void saveRole(event)}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl"
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

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.descriptionLabel}
              <input
                type="text"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.bundleLabel}
              <select
                value={formBundle}
                onChange={(event) => setFormBundle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background-deep)] px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              >
                <option value="">{messages.noBundle}</option>
                {bundles.map((bundle) => (
                  <option key={bundle.token} value={bundle.token}>
                    {bundle.name}
                  </option>
                ))}
              </select>
            </label>

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
