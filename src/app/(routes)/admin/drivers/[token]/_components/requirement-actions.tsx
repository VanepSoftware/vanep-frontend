import Link from "next/link";

import { reviewEntryHref, reviewHref, rowSubmission } from "@/lib/admin/driver-compliance/review";
import { interpolate, plural, t } from "@/lib/l10n";

import type { RequirementActionProps } from "./requirements-list";

const messages = t("admin").driverReview;
const review = messages.review;

/** "Revisar N pendentes" no topo do checklist, quando há o que revisar. */
export function ReviewAllLink({ driverToken, pending }: { driverToken: string; pending: number }) {
  if (pending === 0) return null;
  return (
    <Link
      href={reviewEntryHref(driverToken)}
      className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm hover:brightness-110"
    >
      {plural(review.reviewPending, pending)}
    </Link>
  );
}

/** "Revisar" num envio pendente, "Ver" num já decidido; nada sem envio. */
export function RequirementAction({ item, driverToken }: RequirementActionProps) {
  const submission = rowSubmission(item);
  if (!submission) return null;
  const pending = submission.status === "PENDING";
  const document = messages.requirementInSentence[item.requirement];
  return (
    <Link
      href={reviewHref(driverToken, submission.kind, submission.token)}
      aria-label={interpolate(pending ? review.reviewLabel : review.viewLabel, { document })}
      className={
        pending
          ? "text-sm font-semibold text-brand hover:text-brand-strong"
          : "text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {pending ? review.reviewOne : review.view}
    </Link>
  );
}
