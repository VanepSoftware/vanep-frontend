"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  buildClientPatch,
  InvalidRatingError,
  isEmptyPatch,
  toEditForm,
  type ClientEditForm,
} from "@/lib/admin/client-patch";
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

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function ClientAvatar({
  client,
  photoVersion,
  statusDot,
}: {
  client: Client;
  photoVersion?: number;
  statusDot?: boolean;
}) {
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      {client.photo ? (
        <Image
          key={photoVersion}
          src={`/api/admin/clients/${encodeURIComponent(client.token)}/photo${
            photoVersion != null ? `?v=${photoVersion}` : ""
          }`}
          alt=""
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-full object-cover shadow-[0_0_0_3px_var(--brand-soft)]"
        />
      ) : (
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-lg font-extrabold text-brand-foreground shadow-[0_0_0_3px_var(--brand-soft)]">
          {initials(client.name)}
        </div>
      )}
      {statusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
            client.active ? "bg-success" : "bg-muted-foreground"
          }`}
        />
      )}
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
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientEditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

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
    setForm(toEditForm(client));
    setEditError(null);
    setPhotoError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setForm(null);
    setEditError(null);
    setPhotoError(null);
  }

  function errorFor(status: number): string {
    if (status === 409) return messages.editConflict;
    if (status === 403) return messages.editForbidden;
    if (status === 404) return messages.editNotFound;
    return messages.editError;
  }

  function photoErrorFor(status: number): string {
    if (status === 400) return messages.photoInvalidType;
    if (status === 413) return messages.photoTooLarge;
    if (status === 403) return messages.editForbidden;
    if (status === 404) return messages.editNotFound;
    return messages.photoUploadError;
  }

  async function uploadPhoto(file: File | null) {
    if (!file || !editTarget) return;

    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(
        `/api/admin/clients/${encodeURIComponent(editTarget.token)}/photo`,
        { method: "POST", body },
      );
      if (!res.ok) {
        setPhotoError(photoErrorFor(res.status));
        return;
      }
      setEditTarget({ ...editTarget, photo: `/api/clients/${editTarget.token}/photo` });
      setPhotoVersion((version) => version + 1);
      await loadClients(page);
    } catch {
      setPhotoError(messages.photoUploadError);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveEdit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!editTarget || !form) return;

    let patch;
    try {
      patch = buildClientPatch(editTarget, form);
    } catch (cause) {
      setEditError(cause instanceof InvalidRatingError ? messages.invalidRating : messages.editError);
      return;
    }

    if (isEmptyPatch(patch)) {
      setEditError(messages.noChanges);
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/clients/${encodeURIComponent(editTarget.token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setEditError(errorFor(res.status));
        return;
      }
      closeEdit();
      setViewTarget(null);
      await loadClients(page);
    } catch {
      setEditError(messages.editError);
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
        <div className="mb-6 flex items-center justify-between rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
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

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
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
                  className="border-b border-border/50 transition-colors duration-150 last:border-b-0 hover:bg-background-deep"
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
                          ? "rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
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
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.96]"
                      >
                        {messages.view}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(client)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.96]"
                      >
                        {messages.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(client)}
                        className="rounded-lg border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger transition-all duration-200 hover:border-danger hover:bg-danger-soft active:scale-[0.96]"
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
            className="rounded-lg border border-border px-3 py-1.5 transition-all duration-200 hover:border-border-strong hover:bg-muted hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
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
            className="rounded-lg border border-border px-3 py-1.5 transition-all duration-200 hover:border-border-strong hover:bg-muted hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={messages.viewTitle}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-foreground">
              {messages.viewTitle}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">{messages.viewHint}</p>

            <div className="mt-4 flex items-center gap-4">
              <ClientAvatar client={viewTarget} statusDot />
              <div>
                <p className="text-base font-bold text-foreground">
                  {viewTarget.name ?? messages.noName}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      viewTarget.active
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {viewTarget.active ? messages.active : messages.inactive}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {viewTarget.rating != null
                      ? `★ ${Number(viewTarget.rating).toFixed(1)}`
                      : messages.noRating}
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-border">
              <DetailRow label={messages.emailLabel}>{viewTarget.email ?? "—"}</DetailRow>
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
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-all duration-200 hover:border-border-strong hover:bg-muted active:scale-[0.97]"
              >
                {common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget != null && form != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={messages.editTitle}
        >
          <form
            onSubmit={(event) => void saveEdit(event)}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
          >
            <h2 className="font-display text-lg font-bold text-foreground">{messages.editTitle}</h2>
            <p className="mt-2 text-xs text-muted-foreground">{messages.editHint}</p>

            {editError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {editError}
              </p>
            )}

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.nameLabel}
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={255}
                className="mt-1 w-full rounded-lg border border-border bg-background-deep px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.emailLabel}
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                maxLength={255}
                className="mt-1 w-full rounded-lg border border-border bg-background-deep px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <div className="mt-4">
              <span className="block text-sm text-muted-foreground">{messages.photoLabel}</span>
              <div className="mt-1 flex items-center gap-4">
                <div className="relative">
                  <ClientAvatar client={editTarget} photoVersion={photoVersion} />
                  <label
                    className={`absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-brand text-brand-foreground transition-opacity duration-200 hover:opacity-90 ${
                      uploadingPhoto ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    <span className="sr-only">{messages.changePhoto}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={(event) => {
                        void uploadPhoto(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {uploadingPhoto ? messages.uploadingPhoto : messages.photoHint}
                  </p>
                </div>
              </div>
              {photoError && (
                <p role="alert" className="mt-1 text-xs text-danger">
                  {photoError}
                </p>
              )}
            </div>

            <label className="mt-4 block text-sm text-muted-foreground">
              {messages.ratingLabel}
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: event.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background-deep px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>

            <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              {messages.activeLabel}
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-all duration-200 hover:border-border-strong hover:bg-muted active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
              >
                {common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
              >
                {saving ? messages.saving : messages.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
