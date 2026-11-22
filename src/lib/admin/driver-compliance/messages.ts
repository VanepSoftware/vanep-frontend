import type { ApiProblem } from "@/lib/admin/api-problem";
import { t } from "@/lib/l10n";

const messages = t("admin").driverReview;

/**
 * Mensagem de um erro da API para o admin: pelo `code` quando a tela conhece,
 * senão o `detail` traduzido pela API, e por fim uma mensagem genérica.
 */
export function problemMessage(problem: ApiProblem): string {
  if (problem.code && problem.code in messages.errors) {
    return messages.errors[problem.code as keyof typeof messages.errors];
  }
  if (problem.status === 403) return messages.errors.forbidden;
  return problem.detail ?? messages.errors.generic;
}
