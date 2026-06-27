import type { JWT } from "next-auth/jwt";

// Buffer para renovar o access token um pouco antes de expirar.
export const ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 30;

const refreshInFlightByToken = new Map<string, Promise<JWT>>();

function authBaseUrl(): string {
  return process.env.AUTH_URL ?? "";
}

/** Lê o `exp` (epoch em segundos) de um JWT de access token, se possível. */
export function getAccessTokenExp(accessToken: string): number | undefined {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
    if (typeof payload.exp !== "number") return undefined;
    return Math.floor(payload.exp);
  } catch {
    return undefined;
  }
}

/**
 * Renova o access token via refresh token no endpoint /oauth2/token do Spring
 * Authorization Server (form-urlencoded, cliente público). Deduplica chamadas
 * concorrentes para o mesmo refresh token.
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken;
  if (!refreshToken || typeof refreshToken !== "string") {
    return token;
  }

  const inFlight = refreshInFlightByToken.get(refreshToken);
  if (inFlight) {
    return inFlight;
  }

  const refreshPromise = (async (): Promise<JWT> => {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.AUTH_OAUTH_CLIENT_ID ?? "",
      });

      const response = await fetch(`${authBaseUrl()}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });

      if (!response.ok) {
        return { ...token, accessToken: undefined, refreshToken: undefined };
      }

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
      };

      return {
        ...token,
        accessToken: data.access_token ?? token.accessToken,
        refreshToken: data.refresh_token ?? token.refreshToken,
      };
    } catch {
      return { ...token, accessToken: undefined, refreshToken: undefined };
    } finally {
      refreshInFlightByToken.delete(refreshToken);
    }
  })();

  refreshInFlightByToken.set(refreshToken, refreshPromise);
  return refreshPromise;
}

/**
 * Revoga um token no endpoint /oauth2/revoke do Authorization Server (best-effort). Usado no
 * logout para invalidar o refresh token no servidor — sem isso ele seguiria válido por ~90 dias.
 */
export async function revokeToken(
  token: string,
  tokenTypeHint: "access_token" | "refresh_token",
): Promise<void> {
  try {
    const body = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: process.env.AUTH_OAUTH_CLIENT_ID ?? "",
    });
    await fetch(`${authBaseUrl()}/oauth2/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // Revogação é best-effort: o cookie de sessão já foi limpo de qualquer forma.
  }
}

/** Renova o access token caso esteja expirado (ou perto disso). */
export async function maybeRefreshAccessToken(
  token: JWT,
): Promise<{ token: JWT; refreshed: boolean }> {
  const now = Math.floor(Date.now() / 1000);
  const currentExp = token.accessToken
    ? getAccessTokenExp(token.accessToken as string)
    : undefined;

  if (currentExp && now < currentExp - ACCESS_TOKEN_REFRESH_BUFFER_SECONDS) {
    return { token, refreshed: false };
  }

  if (token.refreshToken) {
    const newToken = await refreshAccessToken(token);
    return { token: newToken, refreshed: true };
  }

  return { token, refreshed: false };
}
