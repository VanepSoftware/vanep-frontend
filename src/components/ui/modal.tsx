"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  /** Esc e o "Cancelar" chamam isto; quem abre decide se fecha (por exemplo, não fecha enquanto envia). */
  onClose: () => void;
  /** O `id` do título, para o leitor de tela anunciar o diálogo. */
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Diálogo modal sobre o `<dialog>` nativo: o navegador prende o foco dentro,
 * deixa o resto da página inerte e devolve o foco a quem abriu ao fechar.
 */
export function Modal({ open, onClose, labelledBy, children, className = "max-w-md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // O Esc fecharia o diálogo por conta própria; o estado de quem abriu é que manda.
        event.preventDefault();
        onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/30 backdrop:backdrop-blur-sm ${className}`}
    >
      {open && children}
    </dialog>
  );
}
