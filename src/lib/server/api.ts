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

export async function proxyApiRequest(
  req: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { token: fresh, refreshed } = await maybeRefreshAccessToken(token);
  if (!fresh.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${fresh.accessToken}`,
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

  return refreshed ? persistSession(proxied, fresh) : proxied;
}
