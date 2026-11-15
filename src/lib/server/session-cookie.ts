import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest, NextResponse } from "next/server";

import { sessionCookieName, sessionSecret } from "@/lib/server/oauth-session";

// Default do NextAuth: authOptions não define session.maxAge.
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// O NextAuth fatia o valor em 4096 − 163. 4096 é o limite de um cookie no
// navegador; 163 é a folga que ele reserva para o nome e os atributos.
const CHUNK_SIZE = 4096 - 163;

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
 * Regrava a sessão no formato do NextAuth, fatiando acima de ~4KB.
 *
 * O login já passa pelo SessionStore, que fatia sozinho. O proxy, depois do
 * refresh, regrava o cookie na mão. Sem fatiar, o navegador descarta o
 * Set-Cookie quando o valor passa do limite e a sessão renovada se perde.
 * Sem apagar o que ficou para trás, o getToken junta o cookie novo com os
 * pedaços antigos — o nome e os `.0`, `.1` — e a descriptografia falha.
 */
export async function persistSession(
  req: NextRequest,
  response: NextResponse,
  token: JWT,
): Promise<void> {
  const name = sessionCookieName();
  const secure = name.startsWith("__Secure-");
  const value = await encode({
    token,
    secret: sessionSecret(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  const chunks = chunkSessionValue(name, value);
  const written = new Set(chunks.map((chunk) => chunk.name));

  for (const chunk of chunks) {
    response.cookies.set(chunk.name, chunk.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  clearStaleCookies(req, response, name, secure, written);
}

function clearStaleCookies(
  req: NextRequest,
  response: NextResponse,
  name: string,
  secure: boolean,
  written: Set<string>,
): void {
  for (const cookie of req.cookies.getAll()) {
    const isSessionCookie = cookie.name === name || cookie.name.startsWith(`${name}.`);
    if (isSessionCookie && !written.has(cookie.name)) {
      response.cookies.delete({
        name: cookie.name,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
      });
    }
  }
}
