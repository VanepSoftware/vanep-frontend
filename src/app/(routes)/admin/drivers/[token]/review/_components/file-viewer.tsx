"use client";

import { useState } from "react";

import { type ViewerKind, ZOOM_STEPS, formatFileSize, nextZoom, viewerKind } from "@/lib/admin/driver-compliance/review";
import type { Submission } from "@/lib/admin/driver-compliance/types";
import { adminFileUrl } from "@/lib/admin/driver-compliance/urls";
import { t } from "@/lib/l10n";

const file = t("admin").driverReview.review.file;

/**
 * O arquivo do envio ao lado dos dados. Imagem com zoom e giro; PDF no leitor
 * do navegador, que já tem o zoom e as páginas. Sempre dá para abrir em nova aba.
 */
export function FileViewer({ submission }: { submission: Submission }) {
  const url = adminFileUrl(submission.fileUrl);
  const kind = viewerKind(submission.file?.mimeType);
  const name = submission.file?.originalName ?? null;
  const size = submission.file ? formatFileSize(submission.file.sizeBytes) : null;

  return (
    <section
      aria-label={file.label}
      className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-background"
    >
      {/* `key` reinicia zoom e giro ao trocar de arquivo. */}
      <Viewer key={url ?? "none"} url={url} kind={kind} caption={[name, size].filter(Boolean).join(" · ")} />
    </section>
  );
}

function Viewer({ url, kind, caption }: { url: string | null; kind: ViewerKind; caption: string }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!url) {
    return <p className="m-auto p-10 text-sm text-muted-foreground">{file.missing}</p>;
  }

  const imageControls = kind === "image" && !failed;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="min-w-0 truncate text-[13px] text-muted-foreground">{caption}</span>
        <div className="flex items-center gap-1">
          {imageControls && (
            <>
              <ToolButton label={file.zoomOut} disabled={zoom <= ZOOM_STEPS[0]} onClick={() => setZoom(nextZoom(zoom, -1))}>
                <path d="M5 12h14" />
              </ToolButton>
              <span className="w-12 text-center text-[13px] tabular-nums text-muted-foreground" aria-live="polite">
                {zoom}%
              </span>
              <ToolButton
                label={file.zoomIn}
                disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                onClick={() => setZoom(nextZoom(zoom, 1))}
              >
                <path d="M12 5v14M5 12h14" />
              </ToolButton>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <ToolButton label={file.rotate} onClick={() => setRotation((current) => (current + 90) % 360)}>
                <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
              </ToolButton>
              <ToolButton
                label={file.fit}
                onClick={() => {
                  setZoom(100);
                  setRotation(0);
                }}
              >
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </ToolButton>
            </>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={file.openInNewTab}
            title={file.openInNewTab}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon>
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </Icon>
          </a>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-background-deep">
        {failed ? (
          <p className="p-10 text-center text-sm text-danger">{file.loadError}</p>
        ) : kind === "image" ? (
          <div className="flex min-h-full items-center justify-center p-6">
            {/* O arquivo vem do proxy autenticado com cache imutável; `next/image` não otimiza isso. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={file.preview}
              onError={() => setFailed(true)}
              style={{ width: `${zoom}%`, transform: `rotate(${rotation}deg)` }}
              className="max-w-none origin-center rounded shadow-sm transition-transform duration-150"
            />
          </div>
        ) : kind === "pdf" ? (
          <iframe src={url} title={file.preview} className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">{file.unsupported}</p>
        )}
      </div>
    </>
  );
}

function ToolButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon>{children}</Icon>
    </button>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
