import { t } from "@/lib/l10n";

const messages = t("admin").driverReview;

/** Faixa de erro com "Tentar novamente". */
export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-none font-semibold underline-offset-2 hover:underline"
        >
          {messages.retry}
        </button>
      )}
    </div>
  );
}
