import { historyLine, type HistoryLine } from "@/lib/admin/driver-compliance/driver-page";
import type { HistoryEvent } from "@/lib/admin/driver-compliance/types";
import { t } from "@/lib/l10n";

const page = t("admin").driverReview.driver;

const DOT: Record<HistoryLine["tone"], string> = {
  brand: "bg-brand",
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-border-strong",
};

/** Os últimos 50 eventos, do mais novo ao mais antigo, como a API manda. */
export function HistoryList({ history }: { history: HistoryEvent[] }) {
  return (
    <section aria-labelledby="history-title" className="rounded-2xl border border-border bg-background p-6">
      <h2 id="history-title" className="font-display text-base font-bold text-foreground">
        {page.historyTitle}
      </h2>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{page.historyEmpty}</p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {history.map((event, index) => {
            const line = historyLine(event);
            const last = index === history.length - 1;
            return (
              <li key={`${event.at}-${event.kind}-${index}`} className="flex gap-3">
                <span aria-hidden="true" className="flex flex-col items-center">
                  <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${DOT[line.tone]}`} />
                  {!last && <span className="w-px flex-1 bg-border" />}
                </span>
                <span className={`flex min-w-0 flex-col ${last ? "" : "pb-4"}`}>
                  <span className="text-sm text-foreground">{line.title}</span>
                  <span className="text-[13px] text-muted-foreground">{line.meta}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
