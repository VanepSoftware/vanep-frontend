"use client";

import { useId } from "react";

import { Modal } from "@/components/ui/modal";
import { t } from "@/lib/l10n";

const common = t("common");

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  /**
   * `danger` para excluir ou recusar; `brand` para uma ação que segue o fluxo;
   * `success` quando o botão que abriu o diálogo já é verde (aprovar um documento).
   */
  tone?: "danger" | "brand" | "success";
  /** Ícone antes do rótulo do botão de confirmar, igual ao do botão que abriu o diálogo. */
  icon?: React.ReactNode;
  /** Um erro da última tentativa, mostrado dentro do diálogo. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const CONFIRM_CLASS = {
  danger: "bg-danger text-white",
  brand: "bg-brand text-brand-foreground",
  success: "bg-success text-white",
} as const;

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  tone = "danger",
  error = null,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={() => !busy && onCancel()} labelledBy={titleId}>
      <div className="p-6">
        <h2 id={titleId} className="font-display text-lg font-bold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-all duration-200 hover:border-border-strong hover:bg-muted active:scale-[0.97] disabled:opacity-50"
          >
            {common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-[0.97] active:shadow-sm disabled:opacity-50 ${CONFIRM_CLASS[tone]}`}
          >
            {!busy && icon}
            {busy ? common.loading : (confirmLabel ?? common.confirm)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
