import { afterEach, describe, expect, it, vi } from "vitest";

import { authOptions } from "@/auth";

const provider = authOptions.providers[0] as any;

describe("authOptions", () => {
  it("registers the vanep oauth provider", () => {
    expect(provider.id).toBe("vanep");
    expect(provider.type).toBe("oauth");
  });

  it("uses the jwt session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("reads client id, secret and debug from env at import time", async () => {
    const prev = {
      id: process.env.AUTH_OAUTH_CLIENT_ID,
      secret: process.env.AUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
      debug: process.env.NEXTAUTH_DEBUG,
    };
    try {
      vi.resetModules();
      process.env.AUTH_OAUTH_CLIENT_ID = "vanep-frontend";
      process.env.AUTH_SECRET = "the-secret";
      process.env.NODE_ENV = "production";
      process.env.NEXTAUTH_DEBUG = "true";

      const mod = await import("@/auth");

      expect(mod.authOptions.secret).toBe("the-secret");
      expect((mod.authOptions.providers[0] as any).clientId).toBe("vanep-frontend");
      expect(mod.authOptions.debug).toBe(true);
    } finally {
      process.env.AUTH_OAUTH_CLIENT_ID = prev.id;
      process.env.AUTH_SECRET = prev.secret;
      process.env.NODE_ENV = prev.nodeEnv;
      process.env.NEXTAUTH_DEBUG = prev.debug;
      vi.resetModules();
    }
  });

  it("maps the backend profile to a NextAuth user", () => {
    const user = provider.profile({ token: "tok-123", name: "Ana", email: "ana@vanep.com" });
    expect(user).toEqual({ id: "tok-123", name: "Ana", email: "ana@vanep.com", image: null });
  });
});

describe("jwt callback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stores tokens on first sign-in", async () => {
    const result = await authOptions.callbacks!.jwt!({
      token: {} as any,
      account: { access_token: "at", refresh_token: "rt" } as any,
    } as any);

    expect(result.accessToken).toBe("at");
    expect(result.refreshToken).toBe("rt");
  });

  it("returns the token unchanged when nothing to refresh", async () => {
    const token = { accessToken: undefined } as Record<string, unknown>;
    const result = await authOptions.callbacks!.jwt!({ token: token as any } as any);

    expect(result).toEqual(token);
  });
});

describe("session callback", () => {
  it("returns the session as-is", async () => {
    const session = { user: { email: "a@b.com" } } as any;
    const result = await authOptions.callbacks!.session!({ session } as any);
    expect(result).toBe(session);
  });
});

describe("userinfo request", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fetches the profile with the bearer token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ token: "t", email: "a@b.com" }),
      }),
    );

    const result = await provider.userinfo.request({ tokens: { access_token: "abc" } });
    expect(result.email).toBe("a@b.com");
  });

  it("throws when the profile request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "nope" }),
    );

    await expect(provider.userinfo.request({ tokens: { access_token: "abc" } })).rejects.toThrow(
      "userinfo 401",
    );
  });
});
