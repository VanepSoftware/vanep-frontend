import type { Blocker } from "@/lib/admin/driver-compliance/types";

/**
 * Códigos estáveis do ProblemDetail da API (D20 da VAN-86). A tela decide pelo
 * `code`, nunca pelo texto do `detail`. Erros antigos da API vêm sem `code`.
 */
const API_PROBLEM_CODES = [
  "document.review.reason_code_required",
  "document.review.reason_required",
  "document.review.file_required",
  "document.review.field_required",
  "document.review.stale",
  "document.expires_at.past",
  "document.expires_at.too_far",
  "document.data.not_approved",
  "document.submission.reviewed",
  "document.submission.pending_exists",
  "driver_cnh.registration.duplicate",
  "driver_cnh.issue_date.future",
  "driver_cnh.category.invalid",
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
  /** O campo do corpo que a API recusou: nos erros de regra e no primeiro erro de formato. */
  field: string | null;
  /** Os erros de formato do corpo (Bean Validation), um por campo, já em pt-BR. */
  errors: FieldProblem[];
  /** Só no 422 `driver.onboarding.documents_not_approved`. */
  blockers: Blocker[];
};

export type FieldProblem = { field: string | null; message: string };

const KNOWN_CODES: ReadonlySet<string> = new Set(API_PROBLEM_CODES);

function isCode(value: unknown): value is ApiProblemCode {
  return typeof value === "string" && KNOWN_CODES.has(value);
}

function fieldProblems(value: unknown): FieldProblem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const { field, message } = item as Record<string, unknown>;
    if (typeof message !== "string") return [];
    return [{ field: typeof field === "string" ? field : null, message }];
  });
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
    field: typeof body.field === "string" ? body.field : null,
    errors: fieldProblems(body.errors),
    blockers: Array.isArray(body.blockers) ? (body.blockers as Blocker[]) : [],
  };
}
