import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest, NextResponse } from "next/server";

// NextAuth's own default, applied because authOptions does not set session.maxAge.
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Same budget NextAuth uses before splitting the session cookie: 4096 bytes minus its own estimate
// of what the name and attributes take.
const CHUNK_SIZE = 4096 - 163;

function frontendUrl(): string {
  const url = process.env.NEXTAUTH_URL;
  if (!url) throw new Error("NEXTAUTH_URL must be set");
  return url;
}

function secureCookiesEnabled(): boolean {
  return frontendUrl().startsWith("https://");
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  return secret;
}

export function sessionCookieName(): string {
  return secureCookiesEnabled() ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export function chunkSessionValue(name: string, value: string): { name: string; value: string }[] {
  const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
  if (chunkCount <= 1) {
    return [{ name, value }];
  }
  return Array.from({ length: chunkCount }, (_, index) => ({
    name: `${name}.${index}`,
    value: value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  }));
}

/**
 * Writes the session back to the browser.
 *
 * The authorization server runs with `reuseRefreshTokens(false)`, so a refresh burns the token it
 * was given and returns a new one. Without this write the cookie keeps the burned token and the
 * next refresh fails with `invalid_grant`, which surfaces as a 401 on every later request.
 */
export async function persistSession(
  req: NextRequest,
  response: NextResponse,
  token: JWT,
): Promise<void> {
  const name = sessionCookieName();
  const value = await encode({
    token,
    secret: sessionSecret(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  const chunks = chunkSessionValue(name, value);

  for (const chunk of chunks) {
    response.cookies.set(chunk.name, chunk.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: secureCookiesEnabled(),
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  clearStaleCookies(req, response, new Set(chunks.map((chunk) => chunk.name)));
}

/**
 * A session that used to be chunked, or that stops being chunked, leaves cookies the browser would
 * still send. NextAuth would then reassemble a mix of old and new and fail to decrypt.
 */
function clearStaleCookies(req: NextRequest, response: NextResponse, written: Set<string>): void {
  const name = sessionCookieName();
  for (const cookie of req.cookies.getAll()) {
    const isSessionCookie = cookie.name === name || cookie.name.startsWith(`${name}.`);
    if (isSessionCookie && !written.has(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  }
}
