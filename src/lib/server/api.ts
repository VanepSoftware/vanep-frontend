import { encode, getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  maybeRefreshAccessToken,
  sessionCookieName,
  sessionSecret,
} from "@/lib/server/oauth-session";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

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

async function persistSession(response: NextResponse, token: JWT): Promise<NextResponse> {
  const encoded = await encode({
    token,
    secret: sessionSecret(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  response.cookies.set({
    name: sessionCookieName(),
    value: encoded,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: sessionCookieName().startsWith("__Secure-"),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

async function withRefreshedSession(response: NextResponse, auth: Auth): Promise<NextResponse> {
  return auth.refreshed ? persistSession(response, auth.token) : response;
}

export async function proxyApiRequest(
  req: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const auth = await requireAccessToken(req);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  return withRefreshedSession(proxied, auth);
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
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  return withRefreshedSession(proxied, auth);
}

/**
 * Para baixar binário (foto): a resposta não é texto, então o corpo precisa
 * passar como ArrayBuffer em vez do `response.text()` do proxyApiRequest.
 */
export async function proxyBinaryDownload(req: NextRequest, path: string): Promise<NextResponse> {
  const auth = await requireAccessToken(req);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    cache: "no-store",
  });

  const contentType = response.headers.get("Content-Type") ?? "application/octet-stream";

  const proxied = response.ok
    ? new NextResponse(await response.arrayBuffer(), {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      })
    : new NextResponse((await response.text()) || null, {
        status: response.status,
        headers: { "Content-Type": contentType },
      });

  return withRefreshedSession(proxied, auth);
}
