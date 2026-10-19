"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { t } from "@/lib/l10n";

const messages = t("admin").documentValidation;
const common = t("common");

type ApprovalStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";
type DocumentType =
  | "CRLV"
  | "VEHICLE_INSPECTION"
  | "MUNICIPAL_AUTHORIZATION"
  | "CRIMINAL_RECORD"
  | "RESIDENCE_PROOF"
  | "PROFILE_PHOTO"
  | "VEHICLE_PHOTO"
  | "OTHER";

type FilterMode = "pending" | "all";

type Driver = {
  token: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  cnpj: string | null;
  photo: string | null;
  rating: number | null;
  bio: string | null;
  experienceYears: number | null;
  basePrice: number | null;
  approvalStatus: ApprovalStatus;
  active: boolean;
  available: boolean;
  createdAt: string | null;
};

type DriversPage = {
  content: Driver[];
  page: number;
  totalPages: number;
  totalElements: number;
};

type DriverDocument = {
  token: string;
  driverToken: string;
  documentType: DocumentType;
  fileUrl: string | null;
  expiresAt: string | null;
  status: DocumentStatus;
  reviewMethod: "MANUAL" | "AUTO" | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
};

const PAGE_SIZE = 10;

const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  "CRLV",
  "VEHICLE_INSPECTION",
  "MUNICIPAL_AUTHORIZATION",
  "CRIMINAL_RECORD",
  "RESIDENCE_PROOF",
  "PROFILE_PHOTO",
  "VEHICLE_PHOTO",
];

type ChecklistItem =
  | { kind: "uploaded"; doc: DriverDocument }
  | { kind: "missing"; documentType: DocumentType };

function buildDocumentChecklist(uploadedDocs: DriverDocument[]): {
  items: ChecklistItem[];
  sentCount: number;
  totalRequired: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingCount: number;
} {
  const items: ChecklistItem[] = [];
  let missingCount = 0;

  for (const docType of REQUIRED_DOCUMENT_TYPES) {
    const matches = uploadedDocs.filter((d) => d.documentType === docType);
    if (matches.length > 0) {
      for (const doc of matches) {
        items.push({ kind: "uploaded", doc });
      }
    } else {
      missingCount += 1;
      items.push({ kind: "missing", documentType: docType });
    }
  }

  for (const doc of uploadedDocs.filter((d) => d.documentType === "OTHER")) {
    items.push({ kind: "uploaded", doc });
  }

  const approvedCount = uploadedDocs.filter((d) => d.status === "APPROVED").length;
  const pendingCount = uploadedDocs.filter((d) => d.status === "PENDING").length;
  const rejectedCount = uploadedDocs.filter((d) => d.status === "REJECTED").length;
  const sentRequiredCount = REQUIRED_DOCUMENT_TYPES.length - missingCount;

  return {
    items,
    sentCount: sentRequiredCount,
    totalRequired: REQUIRED_DOCUMENT_TYPES.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    missingCount,
  };
}

function parseDriversPage(data: unknown): DriversPage {
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

function parseDocumentsList(data: unknown): DriverDocument[] {
  if (Array.isArray(data)) return data as DriverDocument[];
  const raw = data as { content?: DriverDocument[] };
  return raw.content ?? [];
}

function formatDate(value: string | null | undefined): string {
  if (!value) return messages.noValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return messages.noValue;
  return date.toLocaleDateString("pt-BR");
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return messages.noValue;
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCpfCnpj(cpf: string | null | undefined, cnpj: string | null | undefined): string {
  const parts = [cpf, cnpj].filter((val): val is string => Boolean(val && val.trim()));
  if (parts.length === 0) return messages.noValue;
  return parts.join(" / ");
}

function approvalClass(status: ApprovalStatus): string {
  if (status === "APPROVED") {
    return "inline-flex items-center whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand";
  }
  if (status === "REJECTED") {
    return "inline-flex items-center whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger";
  }
  if (status === "UNDER_REVIEW") {
    return "inline-flex items-center whitespace-nowrap rounded-full border border-brand/40 bg-brand-soft/60 px-2.5 py-1 text-xs font-semibold text-brand";
  }
  return "inline-flex items-center whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground";
}

function documentStatusClass(status: DocumentStatus): string {
  if (status === "APPROVED") {
    return "inline-flex items-center whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand";
  }
  if (status === "REJECTED") {
    return "inline-flex items-center whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger";
  }
  return "inline-flex items-center whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground";
}

export default function AdminDocumentValidationPage() {
  const [filter, setFilter] = useState<FilterMode>("pending");
  const [data, setData] = useState<DriversPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewTarget, setReviewTarget] = useState<Driver | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [previewDocToken, setPreviewDocToken] = useState<string | null>(null);
  const [docBusyToken, setDocBusyToken] = useState<string | null>(null);
  const [rejectingDocToken, setRejectingDocToken] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docActionError, setDocActionError] = useState<string | null>(null);

  const [approvingDriver, setApprovingDriver] = useState(false);
  const [showRejectDriverForm, setShowRejectDriverForm] = useState(false);
  const [driverRejectReason, setDriverRejectReason] = useState("");
  const [rejectingDriver, setRejectingDriver] = useState(false);
  const [driverActionError, setDriverActionError] = useState<string | null>(null);

  const loadDrivers = useCallback(async (targetPage: number, targetFilter: FilterMode) => {
    setLoading(true);
    setError(null);
    const endpoint =
      targetFilter === "pending"
        ? `/api/admin/drivers/pending?page=${targetPage}&size=${PAGE_SIZE}`
        : `/api/admin/drivers?page=${targetPage}&size=${PAGE_SIZE}`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData(parseDriversPage(await res.json()));
    } catch {
      setError(messages.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers(page, filter);
  }, [page, filter, loadDrivers]);

  const loadDriverDocuments = useCallback(async (driverToken: string) => {
    setLoadingDocs(true);
    setDocsError(null);
    setDocActionError(null);

    try {
      const res = await fetch(
        `/api/admin/drivers/${encodeURIComponent(driverToken)}/documents?size=50`,
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDocuments(parseDocumentsList(await res.json()));
    } catch {
      setDocsError(messages.modal.loadDocumentsError);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  function openReviewModal(driver: Driver) {
    setReviewTarget(driver);
    setDocuments([]);
    setPreviewDocToken(null);
    setShowRejectDriverForm(false);
    setDriverRejectReason("");
    setDriverActionError(null);
    setRejectingDocToken(null);
    setDocRejectReason("");
    setDocActionError(null);
    void loadDriverDocuments(driver.token);
  }

  function closeReviewModal() {
    if (approvingDriver || rejectingDriver) return;
    setReviewTarget(null);
    setDocuments([]);
    setPreviewDocToken(null);
    setShowRejectDriverForm(false);
    setDriverRejectReason("");
    setDriverActionError(null);
    setRejectingDocToken(null);
    setDocRejectReason("");
    setDocActionError(null);
  }

  async function handleUpdateDocumentStatus(
    docToken: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ) {
    if (!reviewTarget) return;
    if (status === "REJECTED" && (!rejectionReason || !rejectionReason.trim())) {
      setDocActionError(messages.modal.docRejectionRequired);
      return;
    }

    setDocBusyToken(docToken);
    setDocActionError(null);

    try {
      const res = await fetch(
        `/api/admin/driver-documents/${encodeURIComponent(docToken)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            reviewMethod: "MANUAL",
            ...(status === "REJECTED" ? { rejectionReason: rejectionReason?.trim() } : {}),
          }),
        },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setRejectingDocToken(null);
      setDocRejectReason("");
      await loadDriverDocuments(reviewTarget.token);
    } catch {
      setDocActionError(messages.modal.docStatusUpdateError);
    } finally {
      setDocBusyToken(null);
    }
  }

  async function handleApproveDriver() {
    if (!reviewTarget) return;
    setApprovingDriver(true);
    setDriverActionError(null);

    try {
      const res = await fetch(
        `/api/admin/drivers/${encodeURIComponent(reviewTarget.token)}/approve`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setReviewTarget(null);
      await loadDrivers(page, filter);
    } catch {
      setDriverActionError(messages.modal.approveError);
    } finally {
      setApprovingDriver(false);
    }
  }

  async function handleRejectDriver() {
    if (!reviewTarget) return;
    const trimmedReason = driverRejectReason.trim();
    if (!trimmedReason) {
      setDriverActionError(messages.modal.rejectReasonRequired);
      return;
    }

    setRejectingDriver(true);
    setDriverActionError(null);

    try {
      const res = await fetch(
        `/api/admin/drivers/${encodeURIComponent(reviewTarget.token)}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: trimmedReason }),
        },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setReviewTarget(null);
      await loadDrivers(page, filter);
    } catch {
      setDriverActionError(messages.modal.rejectError);
    } finally {
      setRejectingDriver(false);
    }
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <section>
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{messages.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.description}</p>
        </div>

        <div
          className="inline-flex self-start rounded-xl border border-border bg-background p-1"
          role="tablist"
          aria-label={messages.title}
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === "pending"}
            onClick={() => {
              setFilter("pending");
              setPage(0);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filter === "pending"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.filters.pending}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            onClick={() => {
              setFilter("all");
              setPage(0);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filter === "all"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.filters.all}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadDrivers(page, filter)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {messages.retry}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 font-medium">{messages.columns.name}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.email}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.phone}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.document}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.experience}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.approval}</th>
              <th className="px-4 py-3 font-medium">{messages.columns.createdAt}</th>
              <th className="px-4 py-3 text-right font-medium">{messages.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.loading}
                </td>
              </tr>
            )}
            {!loading && (data?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {messages.empty}
                </td>
              </tr>
            )}
            {!loading &&
              data?.content.map((driver) => (
                <tr
                  key={driver.token}
                  className="border-b border-border/50 transition-colors duration-150 last:border-b-0 hover:bg-background-deep"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                    {driver.name ?? messages.noName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {driver.email ?? messages.noValue}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {driver.phone ?? messages.noValue}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatCpfCnpj(driver.document, driver.cnpj)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {driver.experienceYears != null
                      ? messages.experienceYears.replace("{years}", String(driver.experienceYears))
                      : messages.noValue}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={approvalClass(driver.approvalStatus)}>
                      {messages.approvalStatus[driver.approvalStatus] ?? driver.approvalStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(driver.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openReviewModal(driver)}
                      className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.96]"
                    >
                      {messages.reviewAction}
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

      {reviewTarget != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={messages.modal.title}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {messages.modal.title}
                  </h2>
                  <span className={approvalClass(reviewTarget.approvalStatus)}>
                    {messages.approvalStatus[reviewTarget.approvalStatus] ??
                      reviewTarget.approvalStatus}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{messages.modal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {common.close}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="rounded-xl border border-border bg-background-deep p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {messages.modal.driverInfoSection}
                </h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">{messages.columns.name}</dt>
                    <dd className="font-medium text-foreground">
                      {reviewTarget.name ?? messages.noName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{messages.modal.emailLabel}</dt>
                    <dd className="truncate text-foreground">
                      {reviewTarget.email ?? messages.noValue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{messages.modal.phoneLabel}</dt>
                    <dd className="text-foreground">{reviewTarget.phone ?? messages.noValue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{messages.modal.cpfLabel}</dt>
                    <dd className="text-foreground">
                      {reviewTarget.document ?? messages.noValue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{messages.modal.cnpjLabel}</dt>
                    <dd className="text-foreground">{reviewTarget.cnpj ?? messages.noValue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {messages.modal.experienceLabel}
                    </dt>
                    <dd className="text-foreground">
                      {reviewTarget.experienceYears != null
                        ? messages.experienceYears.replace(
                            "{years}",
                            String(reviewTarget.experienceYears),
                          )
                        : messages.noValue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {messages.modal.basePriceLabel}
                    </dt>
                    <dd className="text-foreground">{formatCurrency(reviewTarget.basePrice)}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {messages.modal.documentsSection}
                  </h3>
                  {!loadingDocs && !docsError && (() => {
                    const summary = buildDocumentChecklist(documents);
                    return (
                      <span className="text-xs font-medium text-muted-foreground">
                        {messages.modal.documentsSummary
                          .replace("{sent}", String(summary.sentCount))
                          .replace("{total}", String(summary.totalRequired))
                          .replace("{approved}", String(summary.approvedCount))
                          .replace("{pending}", String(summary.pendingCount))
                          .replace("{rejected}", String(summary.rejectedCount))
                          .replace("{missing}", String(summary.missingCount))}
                      </span>
                    );
                  })()}
                </div>

                {docActionError && (
                  <div className="mt-3 rounded-xl border border-danger-border bg-danger-soft px-4 py-2.5 text-xs text-danger">
                    {docActionError}
                  </div>
                )}

                {loadingDocs && (
                  <p className="mt-4 rounded-xl border border-border py-8 text-center text-sm text-muted-foreground">
                    {messages.modal.loadingDocuments}
                  </p>
                )}

                {!loadingDocs && docsError && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-xs text-danger">
                    <span>{docsError}</span>
                    <button
                      type="button"
                      onClick={() => void loadDriverDocuments(reviewTarget.token)}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {messages.retry}
                    </button>
                  </div>
                )}

                {!loadingDocs && !docsError && (
                  <ul className="mt-3 flex flex-col gap-3">
                    {buildDocumentChecklist(documents).items.map((item) => {
                      if (item.kind === "missing") {
                        return (
                          <li
                            key={`missing-${item.documentType}`}
                            className="rounded-xl border border-dashed border-border-strong bg-background-deep/60 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <span className="text-sm font-semibold text-foreground">
                                    {messages.documentTypes[item.documentType] ??
                                      item.documentType}
                                  </span>
                                  <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border-strong bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                    {messages.documentStatus.MISSING}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {messages.modal.missingDocumentHint}
                                </p>
                              </div>

                              <span className="whitespace-nowrap rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60">
                                {messages.modal.noFile}
                              </span>
                            </div>
                          </li>
                        );
                      }

                      const { doc } = item;
                      const isBusy = docBusyToken === doc.token;
                      const isRejectingThis = rejectingDocToken === doc.token;

                      return (
                        <li
                          key={doc.token}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-semibold text-foreground">
                                  {messages.documentTypes[doc.documentType] ?? doc.documentType}
                                </span>
                                <span className={documentStatusClass(doc.status)}>
                                  {messages.documentStatus[doc.status] ?? doc.status}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>
                                  {messages.modal.createdAt.replace(
                                    "{date}",
                                    formatDate(doc.createdAt),
                                  )}
                                </span>
                                {doc.expiresAt && (
                                  <span>
                                    {messages.modal.expiresAt.replace(
                                      "{date}",
                                      formatDate(doc.expiresAt),
                                    )}
                                  </span>
                                )}
                              </div>

                              {doc.rejectionReason && (
                                <p className="mt-2 text-xs text-danger">
                                  {messages.modal.rejectionReasonLabel.replace(
                                    "{reason}",
                                    doc.rejectionReason,
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDocToken(doc.token)}
                                className="rounded-lg border border-border-strong bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.96]"
                              >
                                {messages.modal.openFile}
                              </button>

                              <button
                                type="button"
                                disabled={isBusy || doc.status === "APPROVED"}
                                onClick={() =>
                                  void handleUpdateDocumentStatus(doc.token, "APPROVED")
                                }
                                className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition-all duration-200 hover:bg-brand hover:text-brand-foreground disabled:pointer-events-none disabled:opacity-40"
                              >
                                {messages.modal.approveDoc}
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRejectingDocToken(isRejectingThis ? null : doc.token);
                                  setDocRejectReason(doc.rejectionReason ?? "");
                                  setDocActionError(null);
                                }}
                                className="rounded-lg border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger transition-all duration-200 hover:bg-danger-soft disabled:pointer-events-none disabled:opacity-40"
                              >
                                {messages.modal.rejectDoc}
                              </button>
                            </div>
                          </div>

                          {isRejectingThis && (
                            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
                              <input
                                type="text"
                                value={docRejectReason}
                                onChange={(e) => setDocRejectReason(e.target.value)}
                                maxLength={255}
                                placeholder={messages.modal.docRejectionPlaceholder}
                                className="flex-1 rounded-lg border border-border bg-background-deep px-3 py-1.5 text-xs text-foreground outline-none focus:border-brand"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    void handleUpdateDocumentStatus(
                                      doc.token,
                                      "REJECTED",
                                      docRejectReason,
                                    )
                                  }
                                  className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                >
                                  {messages.modal.confirmRejectDoc}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRejectingDocToken(null);
                                    setDocRejectReason("");
                                  }}
                                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                                >
                                  {common.cancel}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {showRejectDriverForm && (
                <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft/40 p-4">
                  <h4 className="text-sm font-semibold text-danger">
                    {messages.modal.rejectReasonTitle}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {messages.modal.rejectReasonHint}
                  </p>
                  <textarea
                    rows={3}
                    maxLength={255}
                    value={driverRejectReason}
                    onChange={(e) => setDriverRejectReason(e.target.value)}
                    placeholder={messages.modal.rejectReasonPlaceholder}
                    className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-danger"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{driverRejectReason.length}/255</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={rejectingDriver}
                        onClick={() => {
                          setShowRejectDriverForm(false);
                          setDriverActionError(null);
                        }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground hover:bg-muted"
                      >
                        {common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={rejectingDriver}
                        onClick={() => void handleRejectDriver()}
                        className="rounded-lg bg-danger px-4 py-1.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {rejectingDriver
                          ? messages.modal.rejectingDriver
                          : messages.modal.confirmRejectDriver}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {driverActionError && (
                <div className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-xs text-danger">
                  {driverActionError}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background-deep px-6 py-4">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={approvingDriver || rejectingDriver}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-border-strong hover:bg-muted disabled:opacity-40"
              >
                {common.close}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={approvingDriver || rejectingDriver}
                  onClick={() => {
                    setShowRejectDriverForm((prev) => !prev);
                    setDriverActionError(null);
                  }}
                  className="rounded-lg border border-danger-border bg-background px-4 py-2 text-sm font-semibold text-danger transition-all duration-200 hover:border-danger hover:bg-danger-soft active:scale-[0.97] disabled:opacity-40"
                >
                  {messages.modal.rejectDriver}
                </button>
                <button
                  type="button"
                  disabled={approvingDriver || rejectingDriver}
                  onClick={() => void handleApproveDriver()}
                  className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow-sm transition-all duration-200 hover:bg-brand-strong active:scale-[0.97] disabled:opacity-40"
                >
                  {approvingDriver ? messages.modal.approvingDriver : messages.modal.approveDriver}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewDocToken != null && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-foreground/80 p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative flex max-h-[90vh] max-w-4xl flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => setPreviewDocToken(null)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-md transition-all duration-200 hover:bg-muted active:scale-[0.97]"
            >
              {common.close}
            </button>
            <Image
              src={`/api/admin/driver-documents/${encodeURIComponent(previewDocToken)}/file`}
              alt={messages.modal.openFile}
              width={960}
              height={680}
              unoptimized
              className="max-h-[82vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
