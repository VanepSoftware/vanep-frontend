import type { Blocker } from "@/lib/admin/driver-compliance/types";

/**
 * Códigos estáveis do ProblemDetail da API (D20 da VAN-86). A tela decide pelo
 * `code`, nunca pelo texto do `detail`. Erros antigos da API vêm sem `code`.
 */
const API_PROBLEM_CODES = [
  "document.review.reason_code_required",
  "document.review.reason_required",
  "document.review.file_required",
  "document.review.stale",
  "document.submission.reviewed",
  "document.submission.pending_exists",
  "driver_cnh.registration.duplicate",
  "driver.onboarding.documents_not_approved",
  "driver.onboarding.not_under_review",
  "driver.rejection.reason.required",
  "request.conflict",
  "vehicle.plate.duplicate",
] as const;

export type ApiProblemCode = (typeof API_PROBLEM_CODES)[number];

export type ApiProblem = {
  status: number;
  /** `null` quando a API não mandou um código conhecido. */
  code: ApiProblemCode | null;
  detail: string | null;
  /** Só no 422 `driver.onboarding.documents_not_approved`. */
  blockers: Blocker[];
};

const KNOWN_CODES: ReadonlySet<string> = new Set(API_PROBLEM_CODES);

function isCode(value: unknown): value is ApiProblemCode {
  return typeof value === "string" && KNOWN_CODES.has(value);
}

/** Lê o corpo de uma resposta de erro. Um corpo vazio ou que não é JSON vira um problema sem código. */
export async function readApiProblem(response: Response): Promise<ApiProblem> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    // corpo vazio ou não JSON: fica só o status
  }

  return {
    status: response.status,
    code: isCode(body.code) ? body.code : null,
    detail: typeof body.detail === "string" ? body.detail : null,
    blockers: Array.isArray(body.blockers) ? (body.blockers as Blocker[]) : [],
  };
}
