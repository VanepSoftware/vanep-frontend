import { type ApiProblem, readApiProblem } from "@/lib/admin/api-problem";

/** Erro de uma chamada do admin, com o problema já lido do corpo. */
export class ApiProblemError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.code ?? problem.detail ?? `HTTP ${problem.status}`);
    this.name = "ApiProblemError";
    this.problem = problem;
  }
}

/**
 * `fetch` das telas do admin pelos proxies `/api/admin`. Devolve o JSON da
 * resposta (ou `null` num 204) e, num erro, lança `ApiProblemError` com o
 * `code` do ProblemDetail. Uma falha de rede vira um problema de status 0.
 */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiProblemError({ status: 0, code: null, detail: null, blockers: [] });
  }

  if (!response.ok) throw new ApiProblemError(await readApiProblem(response));
  if (response.status === 204) return null as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
