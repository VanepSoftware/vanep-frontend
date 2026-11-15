import type { ApiProblem } from "@/lib/admin/api-problem";
import { t } from "@/lib/l10n";

import type { DocumentRejectionReason } from "./types";

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

/**
 * Prévia do que o motorista lê no e-mail da recusa: o texto do motivo e, abaixo,
 * a mensagem do admin. Em `OTHER`, só a mensagem.
 */
export function driverRejectionPreview(
  code: DocumentRejectionReason,
  message: string | null | undefined,
): string[] {
  const note = message?.trim() || null;
  if (code === "OTHER") return note ? [note] : [];
  const text = messages.documentRejectionDriverText[code];
  return note ? [text, note] : [text];
}
