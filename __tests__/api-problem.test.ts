import { describe, expect, it } from "vitest";

import {
  ApiErrorCodes,
  fallbackCodeForStatus,
  normalizeApiProblem,
  parseApiProblem,
  resolveApiProblemMessage,
} from "@/lib/api-problem";

describe("api-problem", () => {
  describe("fallbackCodeForStatus", () => {
    it("returns expected generic codes for common HTTP statuses", () => {
      expect(fallbackCodeForStatus(400)).toBe(ApiErrorCodes.REQUEST_PARAMETER_INVALID);
      expect(fallbackCodeForStatus(401)).toBe(ApiErrorCodes.AUTH_UNAUTHENTICATED);
      expect(fallbackCodeForStatus(403)).toBe(ApiErrorCodes.AUTH_FORBIDDEN);
      expect(fallbackCodeForStatus(404)).toBe(ApiErrorCodes.REQUEST_ROUTE_NOT_FOUND);
      expect(fallbackCodeForStatus(405)).toBe(ApiErrorCodes.REQUEST_METHOD_NOT_ALLOWED);
      expect(fallbackCodeForStatus(409)).toBe(ApiErrorCodes.REQUEST_CONFLICT);
      expect(fallbackCodeForStatus(413)).toBe(ApiErrorCodes.REQUEST_PAYLOAD_TOO_LARGE);
      expect(fallbackCodeForStatus(415)).toBe(ApiErrorCodes.REQUEST_MEDIA_TYPE_UNSUPPORTED);
      expect(fallbackCodeForStatus(422)).toBe(ApiErrorCodes.REQUEST_UNPROCESSABLE);
      expect(fallbackCodeForStatus(429)).toBe(ApiErrorCodes.REQUEST_RATE_LIMITED);
      expect(fallbackCodeForStatus(500)).toBe(ApiErrorCodes.INTERNAL_ERROR);
      expect(fallbackCodeForStatus(502)).toBe(ApiErrorCodes.INTERNAL_ERROR);
      expect(fallbackCodeForStatus(302)).toBe("request.error");
    });
  });

  describe("normalizeApiProblem", () => {
    it("normalizes full RFC 9457 ProblemDetail with errors array and retryAfter", () => {
      const raw = {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Validation failed on fields",
        code: "validation.failed",
        field: "name",
        retryAfter: 60,
        errors: [
          { field: "name", code: "client.name.required", message: "Nome é obrigatório." },
          { field: "email", code: "client.email.invalid", message: "E-mail inválido." },
        ],
        extraProperty: 123,
      };

      const normalized = normalizeApiProblem(raw);

      expect(normalized.type).toBe("about:blank");
      expect(normalized.title).toBe("Bad Request");
      expect(normalized.status).toBe(400);
      expect(normalized.detail).toBe("Validation failed on fields");
      expect(normalized.code).toBe("validation.failed");
      expect(normalized.field).toBe("name");
      expect(normalized.retryAfter).toBe(60);
      expect(normalized.errors).toHaveLength(2);
      expect(normalized.errors?.[0]).toEqual({
        field: "name",
        code: "client.name.required",
        message: "Nome é obrigatório.",
      });
      expect(normalized.extraProperty).toBe(123);
    });

    it("handles non-object and null gracefully", () => {
      expect(normalizeApiProblem(null, 404)).toEqual({
        status: 404,
        code: ApiErrorCodes.REQUEST_ROUTE_NOT_FOUND,
      });

      expect(normalizeApiProblem("string", 500)).toEqual({
        status: 500,
        code: ApiErrorCodes.INTERNAL_ERROR,
      });
    });

    it("falls back status and code when missing in raw object", () => {
      const normalized = normalizeApiProblem({}, 403);
      expect(normalized.status).toBe(403);
      expect(normalized.code).toBe(ApiErrorCodes.AUTH_FORBIDDEN);
      expect(normalized.detail).toBeUndefined();
    });

    it("filters out invalid error elements in errors array", () => {
      const normalized = normalizeApiProblem({
        status: 400,
        code: "validation.failed",
        errors: ["invalid", null, { field: "email", message: "invalid email" }],
      });
      expect(normalized.errors).toEqual([{ field: "email", message: "invalid email" }]);
    });

    it("handles cooldown profile problem with retryAfter", () => {
      const normalized = normalizeApiProblem({
        status: 409,
        code: ApiErrorCodes.USER_PROFILE_NAME_COOLDOWN,
        field: "name",
        retryAfter: 120,
      });
      expect(normalized.code).toBe("user.profile.name.cooldown");
      expect(normalized.field).toBe("name");
      expect(normalized.retryAfter).toBe(120);
    });
  });

  describe("parseApiProblem", () => {
    it("parses valid JSON ProblemDetail from Response", async () => {
      const response = new Response(
        JSON.stringify({
          status: 409,
          code: ApiErrorCodes.CLIENT_EMAIL_DUPLICATE,
          detail: "E-mail já cadastrado.",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/problem+json" },
        },
      );

      const problem = await parseApiProblem(response);

      expect(problem.status).toBe(409);
      expect(problem.code).toBe(ApiErrorCodes.CLIENT_EMAIL_DUPLICATE);
      expect(problem.detail).toBe("E-mail já cadastrado.");
    });

    it("handles empty body response", async () => {
      const response = new Response("", { status: 401 });
      const problem = await parseApiProblem(response);

      expect(problem.status).toBe(401);
      expect(problem.code).toBe(ApiErrorCodes.AUTH_UNAUTHENTICATED);
    });

    it("handles non-JSON plain text response", async () => {
      const response = new Response("Gateway Timeout", { status: 504 });
      const problem = await parseApiProblem(response);

      expect(problem.status).toBe(504);
      expect(problem.code).toBe(ApiErrorCodes.INTERNAL_ERROR);
      expect(problem.detail).toBe("Gateway Timeout");
    });

    it("handles stream read failure gracefully", async () => {
      const response = {
        status: 500,
        text: () => Promise.reject(new Error("stream broke")),
      } as unknown as Response;

      const problem = await parseApiProblem(response);
      expect(problem.status).toBe(500);
      expect(problem.code).toBe(ApiErrorCodes.INTERNAL_ERROR);
    });
  });

  describe("resolveApiProblemMessage", () => {
    it("uses codeOverrides mapping first", () => {
      const problem = {
        status: 409,
        code: ApiErrorCodes.ROLE_PERMISSION_NAME_DUPLICATE,
        detail: "Default message from server",
      };

      const msg = resolveApiProblemMessage(problem, "Fallback", {
        [ApiErrorCodes.ROLE_PERMISSION_NAME_DUPLICATE]: "Nome já utilizado.",
      });

      expect(msg).toBe("Nome já utilizado.");
    });

    it("extracts validation message from errors array when validation.failed", () => {
      const problem = {
        status: 400,
        code: ApiErrorCodes.VALIDATION_FAILED,
        detail: "Check fields",
        errors: [{ field: "name", message: "O nome não pode estar em branco." }],
      };

      const msg = resolveApiProblemMessage(problem, "Fallback");
      expect(msg).toBe("O nome não pode estar em branco.");
    });

    it("falls back to detail when validation errors array is empty or lacks messages", () => {
      const problem = {
        status: 400,
        code: ApiErrorCodes.VALIDATION_FAILED,
        detail: "Verifique os campos destacados.",
        errors: [{ field: "name" }],
      };

      const msg = resolveApiProblemMessage(problem, "Fallback");
      expect(msg).toBe("Verifique os campos destacados.");
    });

    it("returns default message for security and rate limit errors when detail is absent", () => {
      expect(
        resolveApiProblemMessage(
          { status: 401, code: ApiErrorCodes.AUTH_UNAUTHENTICATED },
          "Fallback",
        ),
      ).toBe("Autenticação necessária. Faça login novamente.");

      expect(
        resolveApiProblemMessage({ status: 403, code: ApiErrorCodes.AUTH_FORBIDDEN }, "Fallback"),
      ).toBe("Você não tem permissão para realizar esta ação.");

      expect(
        resolveApiProblemMessage(
          { status: 429, code: ApiErrorCodes.REQUEST_RATE_LIMITED },
          "Fallback",
        ),
      ).toBe("Muitas tentativas. Aguarde um momento e tente novamente.");

      expect(
        resolveApiProblemMessage({ status: 500, code: ApiErrorCodes.INTERNAL_ERROR }, "Fallback"),
      ).toBe("Ocorreu um erro inesperado. Tente novamente em instantes.");
    });

    it("prefers problem.detail over security defaults when detail is present", () => {
      expect(
        resolveApiProblemMessage(
          {
            status: 403,
            code: ApiErrorCodes.AUTH_FORBIDDEN,
            detail: "Acesso negado para o recurso.",
          },
          "Fallback",
        ),
      ).toBe("Acesso negado para o recurso.");
    });

    it("uses problem.detail for generic errors when no override matches", () => {
      const problem = {
        status: 400,
        code: "custom.error",
        detail: "Mensagem personalizada.",
      };

      const msg = resolveApiProblemMessage(problem, "Fallback");
      expect(msg).toBe("Mensagem personalizada.");
    });

    it("falls back to fallbackMessage when no detail and no code match", () => {
      const problem = {
        status: 400,
        code: "unknown.code",
      };

      const msg = resolveApiProblemMessage(problem, "Fallback error message");
      expect(msg).toBe("Fallback error message");
    });
  });
});
