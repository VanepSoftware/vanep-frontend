/**
 * RFC 9457 Problem Details contract and error handling for vanep-frontend.
 */

export const ApiErrorCodes = {
  // Generic & Framework (RFC 9457 / Spring / Security)
  VALIDATION_FAILED: "validation.failed",
  REQUEST_BODY_UNREADABLE: "request.body_unreadable",
  REQUEST_PARAMETER_INVALID: "request.parameter_invalid",
  AUTH_UNAUTHENTICATED: "auth.unauthenticated",
  AUTH_FORBIDDEN: "auth.forbidden",
  REQUEST_ROUTE_NOT_FOUND: "request.route_not_found",
  REQUEST_METHOD_NOT_ALLOWED: "request.method_not_allowed",
  REQUEST_MEDIA_TYPE_UNSUPPORTED: "request.media_type_unsupported",
  REQUEST_PAYLOAD_TOO_LARGE: "request.payload_too_large",
  REQUEST_CONFLICT: "request.conflict",
  REQUEST_UNPROCESSABLE: "request.unprocessable",
  REQUEST_RATE_LIMITED: "request.rate_limited",
  INTERNAL_ERROR: "internal.error",

  // Client domain
  CLIENT_NOT_FOUND: "client.not_found",
  CLIENT_PROFILE_NOT_FOUND: "client.profile.not_found",
  CLIENT_EMAIL_DUPLICATE: "client.email.duplicate",
  AUTH_SIGNUP_EMAIL_DUPLICATE: "auth.signup.email.duplicate",
  CLIENT_NAME_TOO_LONG: "client.name.too_long",
  CLIENT_NAME_REQUIRED: "client.name.required",
  CLIENT_EMAIL_REQUIRED: "client.email.required",
  CLIENT_ACTIVE_REQUIRED: "client.active.required",

  // Driver domain
  DRIVER_NOT_FOUND: "driver.not_found",
  USER_DRIVER_PROFILE_NOT_FOUND: "user.driver_profile.not_found",
  DRIVER_ALREADY_ACTIVE: "driver.already_active",
  DRIVER_NOT_APPROVED: "driver.not_approved",

  // Roles & Permissions domain
  ROLE_PERMISSION_NAME_DUPLICATE: "role_permission.name.duplicate",
  ROLE_PERMISSION_NOT_FOUND: "role_permission.not_found",
  ROLE_NOT_FOUND: "role.not_found",

  // Auth & Profile domain (Phase N+1)
  AUTH_SIGNUP_DOCUMENT_DUPLICATE: "auth.signup.document.duplicate",
  AUTH_ERROR_INVALID_CODE: "auth.error.invalid_code",
  AUTH_ERROR_INVALID_SIGNUP_TICKET: "auth.error.invalid_signup_ticket",
  USER_PROFILE_NAME_COOLDOWN: "user.profile.name.cooldown",
  USER_PROFILE_PHONE_COOLDOWN: "user.profile.phone.cooldown",
  USER_PROFILE_EMAIL_COOLDOWN: "user.profile.email.cooldown",
  USER_PROFILE_FIELD_NULL: "user.profile.field.null",
  USER_PROFILE_PHONE_BLANK: "user.profile.phone.blank",
  USER_PROFILE_EMAIL_SAME: "user.profile.email.same",
  USER_PROFILE_EMAIL_INVALID: "user.profile.email.invalid",
  USER_PROFILE_EMAIL_REQUIRED: "user.profile.email.required",
  USER_PROFILE_NAME_TOO_LONG: "user.profile.name.too_long",
  USER_PROFILE_PHONE_TOO_LONG: "user.profile.phone.too_long",
  USER_PROFILE_EMAIL_TOO_LONG: "user.profile.email.too_long",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes] | string;

export type ApiValidationError = {
  field?: string;
  code?: string;
  message?: string;
};

export type ApiProblem = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  code: string;
  field?: string;
  retryAfter?: number;
  errors?: ApiValidationError[];
  [key: string]: unknown;
};

export function fallbackCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return ApiErrorCodes.REQUEST_PARAMETER_INVALID;
    case 401:
      return ApiErrorCodes.AUTH_UNAUTHENTICATED;
    case 403:
      return ApiErrorCodes.AUTH_FORBIDDEN;
    case 404:
      return ApiErrorCodes.REQUEST_ROUTE_NOT_FOUND;
    case 405:
      return ApiErrorCodes.REQUEST_METHOD_NOT_ALLOWED;
    case 409:
      return ApiErrorCodes.REQUEST_CONFLICT;
    case 413:
      return ApiErrorCodes.REQUEST_PAYLOAD_TOO_LARGE;
    case 415:
      return ApiErrorCodes.REQUEST_MEDIA_TYPE_UNSUPPORTED;
    case 422:
      return ApiErrorCodes.REQUEST_UNPROCESSABLE;
    case 429:
      return ApiErrorCodes.REQUEST_RATE_LIMITED;
    default:
      return status >= 500 ? ApiErrorCodes.INTERNAL_ERROR : "request.error";
  }
}

export function normalizeApiProblem(data: unknown, fallbackStatus = 500): ApiProblem {
  if (typeof data !== "object" || data === null) {
    return {
      status: fallbackStatus,
      code: fallbackCodeForStatus(fallbackStatus),
    };
  }

  const raw = data as Record<string, unknown>;
  const status = typeof raw.status === "number" ? raw.status : fallbackStatus;
  const code =
    typeof raw.code === "string" && raw.code.trim() !== ""
      ? raw.code.trim()
      : fallbackCodeForStatus(status);
  const detail =
    typeof raw.detail === "string" && raw.detail.trim() !== "" ? raw.detail.trim() : undefined;
  const title =
    typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : undefined;
  const type =
    typeof raw.type === "string" && raw.type.trim() !== "" ? raw.type.trim() : undefined;
  const field =
    typeof raw.field === "string" && raw.field.trim() !== "" ? raw.field.trim() : undefined;
  const retryAfter = typeof raw.retryAfter === "number" ? raw.retryAfter : undefined;

  let errors: ApiValidationError[] | undefined;
  if (Array.isArray(raw.errors)) {
    errors = raw.errors
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        field:
          typeof item.field === "string" && item.field.trim() !== ""
            ? item.field.trim()
            : undefined,
        code:
          typeof item.code === "string" && item.code.trim() !== "" ? item.code.trim() : undefined,
        message:
          typeof item.message === "string" && item.message.trim() !== ""
            ? item.message.trim()
            : undefined,
      }));
  }

  return {
    ...raw,
    type,
    title,
    status,
    detail,
    code,
    field,
    retryAfter,
    errors,
  };
}

export async function parseApiProblem(response: Response): Promise<ApiProblem> {
  const status = response.status;
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return {
        status,
        code: fallbackCodeForStatus(status),
      };
    }
    try {
      const data = JSON.parse(text);
      if (typeof data === "object" && data !== null) {
        return normalizeApiProblem(data, status);
      }
    } catch {
      return {
        status,
        detail: text,
        code: fallbackCodeForStatus(status),
      };
    }
  } catch {
    // Response stream cannot be read
  }

  return {
    status,
    code: fallbackCodeForStatus(status),
  };
}

export function resolveApiProblemMessage(
  problem: ApiProblem,
  fallbackMessage: string,
  codeOverrides?: Partial<Record<string, string>>,
): string {
  if (problem.code && codeOverrides && codeOverrides[problem.code]) {
    return codeOverrides[problem.code]!;
  }

  if (problem.code === ApiErrorCodes.VALIDATION_FAILED) {
    if (problem.errors && problem.errors.length > 0) {
      const firstWithMessage = problem.errors.find((err) => err.message);
      if (firstWithMessage?.message) {
        return firstWithMessage.message;
      }
    }
    if (problem.detail) {
      return problem.detail;
    }
  }

  if (problem.code === ApiErrorCodes.AUTH_UNAUTHENTICATED) {
    return problem.detail || "Autenticação necessária. Faça login novamente.";
  }

  if (problem.code === ApiErrorCodes.AUTH_FORBIDDEN) {
    return problem.detail || "Você não tem permissão para realizar esta ação.";
  }

  if (problem.code === ApiErrorCodes.REQUEST_RATE_LIMITED) {
    return problem.detail || "Muitas tentativas. Aguarde um momento e tente novamente.";
  }

  if (problem.code === ApiErrorCodes.INTERNAL_ERROR) {
    return problem.detail || "Ocorreu um erro inesperado. Tente novamente em instantes.";
  }

  if (problem.detail) {
    return problem.detail;
  }

  return fallbackMessage;
}
