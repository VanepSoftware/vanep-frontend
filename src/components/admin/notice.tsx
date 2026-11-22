const TONE = {
  success: "border-success/30 bg-success-soft text-success",
  danger: "border-danger-border bg-danger-soft text-danger",
} as const;

/** Aviso do resultado de uma ação, anunciado ao leitor de tela. */
export function Notice({
  tone,
  children,
  onDismiss,
  dismissLabel,
}: {
  tone: keyof typeof TONE;
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${TONE[tone]}`}
    >
      <div>{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="flex-none text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
