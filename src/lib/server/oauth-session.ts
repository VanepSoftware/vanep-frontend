import type { JWT } from "next-auth/jwt";

export const ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 30;

const refreshInFlightByToken = new Map<string, Promise<JWT>>();

function authBaseUrl(): string {
  return process.env.AUTH_URL ?? "";
}

function oauthClientId(): string {
  return process.env.AUTH_OAUTH_CLIENT_ID ?? "";
}

function oauthClientSecret(): string {
  const secret = process.env.AUTH_OAUTH_CLIENT_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_OAUTH_CLIENT_SECRET is not set. The authorization server only issues refresh " +
        "tokens to a client that authenticates, so without it every session dies at the " +
        "access token TTL.",
    );
  }
  return secret;
}

export function getAccessTokenExp(accessToken: string): number | undefined {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
    if (typeof payload.exp !== "number") return undefined;
    return Math.floor(payload.exp);
  } catch {
    return undefined;
  }
}

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
        client_id: oauthClientId(),
        client_secret: oauthClientSecret(),
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

export async function revokeToken(
  token: string,
  tokenTypeHint: "access_token" | "refresh_token",
): Promise<void> {
  try {
    const body = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: oauthClientId(),
      client_secret: oauthClientSecret(),
    });
    await fetch(`${authBaseUrl()}/oauth2/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    
  }
}

/**
 * `getToken()` reads the session cookie directly, so a refresh done inside a route handler never
 * reaches the `jwt` callback that would persist it. Re-issuing the cookie here is what keeps the
 * next request from starting over with the tokens this one already replaced.
 */
export function sessionCookieName(): string {
  const useSecureCookies = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  return useSecureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) is not set.");
  }
  return secret;
}

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
