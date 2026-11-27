import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { maybeRefreshAccessToken } from "@/lib/server/oauth-session";
import { persistSession } from "@/lib/server/session-cookie";

function apiBaseUrl(): string {
  return process.env.AUTH_URL ?? "";
}

type Auth = { accessToken: string; token: JWT; refreshed: boolean };

async function requireAccessToken(req: NextRequest): Promise<Auth | null> {
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return null;
  }

  const { token: fresh, refreshed } = await maybeRefreshAccessToken(token);
  if (!fresh.accessToken) {
    return null;
  }

  return { accessToken: fresh.accessToken, token: fresh, refreshed };
}

async function withRefreshedSession(
  req: NextRequest,
  response: NextResponse,
  auth: Auth,
): Promise<NextResponse> {
  if (auth.refreshed) {
    await persistSession(req, response, auth.token);
  }
  return response;
}

export async function proxyApiRequest(
  req: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const auth = await requireAccessToken(req);
  if (!auth) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
        code: "auth.unauthenticated",
        error: "unauthorized",
      },
      {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${auth.accessToken}`,
    },
    cache: "no-store",
  });

  const proxied =
    response.status === 204
      ? new NextResponse(null, { status: 204 })
      : new NextResponse((await response.text()) || null, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          },
        });

  return withRefreshedSession(req, proxied, auth);
}

/**
 * Para uploads multipart: o `fetch` precisa gerar o próprio Content-Type com o
 * boundary do FormData, então não dá para reusar o proxyApiRequest (que força JSON).
 */
export async function proxyMultipartUpload(
  req: NextRequest,
  path: string,
  formData: FormData,
): Promise<NextResponse> {
  const auth = await requireAccessToken(req);
  if (!auth) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
        code: "auth.unauthenticated",
        error: "unauthorized",
      },
      {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    cache: "no-store",
  });

  const proxied =
    response.status === 201
      ? new NextResponse(null, { status: 201 })
      : new NextResponse((await response.text()) || null, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          },
        });

  return withRefreshedSession(req, proxied, auth);
}

/**
 * Repassa o `v` (token da mídia) da URL do arquivo para a API. Com ele a API
 * responde com cache imutável; sem ele, `no-cache`.
 */
export function withMediaVersion(req: NextRequest, path: string): string {
  const version = req.nextUrl.searchParams.get("v");
  return version ? `${path}?v=${encodeURIComponent(version)}` : path;
}

/**
 * Os cabeçalhos de um arquivo repassado: o tipo e o cache da API, o
 * `Content-Disposition` dela (inline) e `nosniff`, para o navegador nunca
 * tratar um arquivo enviado por usuário como outro tipo ao abrir em nova aba.
 */
function binaryHeaders(response: Response, contentType: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": response.headers.get("Cache-Control") ?? "private, no-cache",
    "X-Content-Type-Options": "nosniff",
  };
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) headers["Content-Disposition"] = disposition;
  return headers;
}

/**
 * Para baixar binário (foto): a resposta não é texto, então o corpo precisa
 * passar como ArrayBuffer em vez do `response.text()` do proxyApiRequest.
 * O `Cache-Control` é o da API, que sabe se a URL é de um conteúdo imutável.
 */
export async function proxyBinaryDownload(req: NextRequest, path: string): Promise<NextResponse> {
  const auth = await requireAccessToken(req);
  if (!auth) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
        code: "auth.unauthenticated",
        error: "unauthorized",
      },
      {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    cache: "no-store",
  });

  const contentType = response.headers.get("Content-Type") ?? "application/octet-stream";

  const proxied = response.ok
    ? new NextResponse(await response.arrayBuffer(), {
        status: response.status,
        headers: binaryHeaders(response, contentType),
      })
    : new NextResponse((await response.text()) || null, {
        status: response.status,
        headers: { "Content-Type": contentType },
      });

  return withRefreshedSession(req, proxied, auth);
}
