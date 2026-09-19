import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { maybeRefreshAccessToken } from "@/lib/server/oauth-session";
import { persistSession } from "@/lib/server/session-cookie";

function apiBaseUrl(): string {
  return process.env.AUTH_URL ?? "";
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

  if (refreshed) {
    await persistSession(req, proxied, fresh);
  }
  return proxied;
}
