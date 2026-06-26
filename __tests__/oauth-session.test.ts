import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAccessTokenExp,
  maybeRefreshAccessToken,
  refreshAccessToken,
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

describe("maybeRefreshAccessToken", () => {
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
