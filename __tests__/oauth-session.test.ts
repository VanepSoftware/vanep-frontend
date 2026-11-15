import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAccessTokenExp,
  maybeRefreshAccessToken,
  refreshAccessToken,
  revokeToken,
  sessionCookieName,
  sessionSecret,
} from "@/lib/server/oauth-session";

function makeJwt(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `header.${payload}.signature`;
}

const now = () => Math.floor(Date.now() / 1000);

describe("getAccessTokenExp", () => {
  it("reads the exp claim", () => {
    expect(getAccessTokenExp(makeJwt(1234567890))).toBe(1234567890);
  });

  it("returns undefined for a malformed token", () => {
    expect(getAccessTokenExp("not-a-jwt")).toBeUndefined();
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    process.env.AUTH_URL = "http://backend";
    process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
    process.env.AUTH_OAUTH_CLIENT_SECRET = "test-web-client-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the token unchanged when there is no refresh token", async () => {
    const token = { accessToken: "a" };
    expect(await refreshAccessToken(token)).toBe(token);
  });

  it("exchanges the refresh token for new tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "new-access", refresh_token: "new-refresh" }),
      }),
    );

    const result = await refreshAccessToken({ refreshToken: "old-refresh" });

    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
  });

  it("authenticates the client so the server issues a refresh token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "new-access" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await refreshAccessToken({ refreshToken: "old-refresh" });

    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("client_id")).toBe("vanep-frontend");
    expect(body.get("client_secret")).toBe("test-web-client-secret");
  });

  it("keeps the previous refresh token when the server reuses it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "new-access" }),
      }),
    );

    const result = await refreshAccessToken({ refreshToken: "kept" });

    expect(result.refreshToken).toBe("kept");
  });

  it("clears tokens when the refresh fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    const result = await refreshAccessToken({ accessToken: "a", refreshToken: "r" });

    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
  });

  it("clears tokens when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const result = await refreshAccessToken({ accessToken: "a", refreshToken: "r" });

    expect(result.accessToken).toBeUndefined();
  });

  it("dedupes concurrent refreshes for the same refresh token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ access_token: "once" }) });
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([
      refreshAccessToken({ refreshToken: "same" }),
      refreshAccessToken({ refreshToken: "same" }),
    ]);

    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("revokeToken", () => {
  beforeEach(() => {
    process.env.AUTH_URL = "http://backend";
    process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
    process.env.AUTH_OAUTH_CLIENT_SECRET = "test-web-client-secret";
  });

  afterEach(() => vi.restoreAllMocks());

  it("posts to the revoke endpoint with the token hint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await revokeToken("the-token", "refresh_token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend/oauth2/revoke");
    expect(init.method).toBe("POST");
    expect((init.body as URLSearchParams).get("token")).toBe("the-token");
    expect((init.body as URLSearchParams).get("token_type_hint")).toBe("refresh_token");
  });

  it("swallows network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    await expect(revokeToken("t", "access_token")).resolves.toBeUndefined();
  });
});

describe("client authentication", () => {
  afterEach(() => {
    process.env.AUTH_OAUTH_CLIENT_SECRET = "test-web-client-secret";
    vi.restoreAllMocks();
  });

  it("refuses to refresh without the client secret", async () => {
    process.env.AUTH_URL = "http://backend";
    process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
    delete process.env.AUTH_OAUTH_CLIENT_SECRET;
    vi.stubGlobal("fetch", vi.fn());

    const result = await refreshAccessToken({ accessToken: "a", refreshToken: "r" });

    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
  });

  it("does not cache the failure against the refresh token", async () => {
    process.env.AUTH_URL = "http://backend";
    process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
    delete process.env.AUTH_OAUTH_CLIENT_SECRET;
    vi.stubGlobal("fetch", vi.fn());

    await refreshAccessToken({ refreshToken: "poisonable" });

    process.env.AUTH_OAUTH_CLIENT_SECRET = "test-web-client-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "recovered" }) }),
    );

    const result = await refreshAccessToken({ refreshToken: "poisonable" });

    expect(result.accessToken).toBe("recovered");
  });

  it("swallows the missing secret on revoke", async () => {
    delete process.env.AUTH_OAUTH_CLIENT_SECRET;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(revokeToken("t", "refresh_token")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sessionCookieName", () => {
  const previous = process.env.NEXTAUTH_URL;
  afterEach(() => {
    process.env.NEXTAUTH_URL = previous;
  });

  it("uses the secure prefix behind https", () => {
    process.env.NEXTAUTH_URL = "https://www.vanep.com.br";
    expect(sessionCookieName()).toBe("__Secure-next-auth.session-token");
  });

  it("drops the prefix on http", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    expect(sessionCookieName()).toBe("next-auth.session-token");
  });

  it("drops the prefix when the url is unset", () => {
    delete process.env.NEXTAUTH_URL;
    expect(sessionCookieName()).toBe("next-auth.session-token");
  });
});

describe("sessionSecret", () => {
  const previousAuth = process.env.AUTH_SECRET;
  const previousNextAuth = process.env.NEXTAUTH_SECRET;

  afterEach(() => {
    process.env.AUTH_SECRET = previousAuth;
    process.env.NEXTAUTH_SECRET = previousNextAuth;
  });

  it("prefers AUTH_SECRET", () => {
    process.env.AUTH_SECRET = "primary";
    process.env.NEXTAUTH_SECRET = "legacy";
    expect(sessionSecret()).toBe("primary");
  });

  it("falls back to NEXTAUTH_SECRET", () => {
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "legacy";
    expect(sessionSecret()).toBe("legacy");
  });

  it("throws when neither is set", () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(() => sessionSecret()).toThrow(/AUTH_SECRET/);
  });
});

describe("maybeRefreshAccessToken", () => {
  beforeEach(() => {
    process.env.AUTH_URL = "http://backend";
    process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
    process.env.AUTH_OAUTH_CLIENT_SECRET = "test-web-client-secret";
  });

  afterEach(() => vi.restoreAllMocks());

  it("keeps a token that is still valid", async () => {
    const token = { accessToken: makeJwt(now() + 3600), refreshToken: "r" };
    const { refreshed } = await maybeRefreshAccessToken(token);
    expect(refreshed).toBe(false);
  });

  it("refreshes an expired token", async () => {
    process.env.AUTH_URL = "http://backend";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "fresh", refresh_token: "fresh-r" }),
      }),
    );

    const token = { accessToken: makeJwt(now() - 10), refreshToken: "r" };
    const { token: updated, refreshed } = await maybeRefreshAccessToken(token);

    expect(refreshed).toBe(true);
    expect(updated.accessToken).toBe("fresh");
  });

  it("does nothing without access nor refresh token", async () => {
    const { refreshed } = await maybeRefreshAccessToken({});
    expect(refreshed).toBe(false);
  });
});
