import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { maybeRefreshAccessToken } from "@/lib/server/oauth-session";

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

  const { token: fresh } = await maybeRefreshAccessToken(token);
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

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await response.text();
  return new NextResponse(body || null, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
