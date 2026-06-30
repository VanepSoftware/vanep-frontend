import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revokeToken = vi.fn().mockResolvedValue(undefined);
const maybeRefreshAccessToken = vi.fn(async (token) => ({ token, refreshed: false }));

vi.mock("@/lib/server/oauth-session", () => ({
  revokeToken,
  maybeRefreshAccessToken,
}));

async function loadSignOut() {
  const { authOptions } = await import("@/auth");
  return authOptions.events!.signOut!;
}

describe("signOut event", () => {
  beforeEach(() => {
    revokeToken.mockClear();
  });

  afterEach(() => vi.resetModules());

  it("revokes both the refresh and access tokens", async () => {
    const signOut = await loadSignOut();

    await signOut({ token: { refreshToken: "rt", accessToken: "at" } } as any);

    expect(revokeToken).toHaveBeenCalledWith("rt", "refresh_token");
    expect(revokeToken).toHaveBeenCalledWith("at", "access_token");
    expect(revokeToken).toHaveBeenCalledTimes(2);
  });

  it("does not revoke when the tokens are absent", async () => {
    const signOut = await loadSignOut();

    await signOut({ token: {} } as any);

    expect(revokeToken).not.toHaveBeenCalled();
  });
});
