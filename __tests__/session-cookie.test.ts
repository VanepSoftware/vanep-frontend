import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({
  encode: vi.fn(async () => "encoded"),
}));

import { encode } from "next-auth/jwt";

import { chunkSessionValue, persistSession, sessionCookieName } from "@/lib/server/session-cookie";

const encodeMock = vi.mocked(encode);

describe("sessionCookieName", () => {
  afterEach(() => {
    delete process.env.NEXTAUTH_URL;
  });

  it("uses the secure prefix behind https", () => {
    process.env.NEXTAUTH_URL = "https://app.vanep.com.br";

    expect(sessionCookieName()).toBe("__Secure-next-auth.session-token");
  });

  it("drops the prefix on plain http", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";

    expect(sessionCookieName()).toBe("next-auth.session-token");
  });

  it("fails loudly when the frontend url is missing", () => {
    expect(() => sessionCookieName()).toThrow("NEXTAUTH_URL");
  });
});

describe("chunkSessionValue", () => {
  it("keeps a small session in a single cookie", () => {
    expect(chunkSessionValue("session", "short")).toEqual([{ name: "session", value: "short" }]);
  });

  it("splits a session that does not fit and preserves the value in order", () => {
    const value = "x".repeat(5000);

    const chunks = chunkSessionValue("session", value);

    expect(chunks.map((chunk) => chunk.name)).toEqual(["session.0", "session.1"]);
    expect(chunks.map((chunk) => chunk.value).join("")).toBe(value);
  });
});

describe("persistSession", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.AUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_URL;
    delete process.env.AUTH_SECRET;
    vi.clearAllMocks();
  });

  it("writes the encoded session as an http-only cookie", async () => {
    const response = NextResponse.json({});

    await persistSession(new NextRequest("http://localhost:3000/api/admin/clients"), response, {
      accessToken: "a",
      refreshToken: "r",
    });

    const cookie = response.cookies.get("next-auth.session-token");
    expect(cookie?.value).toBe("encoded");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.secure).toBe(false);
  });

  it("clears the chunks left over from a previously larger session", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients");
    req.cookies.set("next-auth.session-token.0", "old-half");
    req.cookies.set("next-auth.session-token.1", "other-half");
    const response = NextResponse.json({});

    await persistSession(req, response, { accessToken: "a" });

    expect(response.cookies.get("next-auth.session-token")?.value).toBe("encoded");
    expect(response.cookies.get("next-auth.session-token.0")?.value).toBe("");
    expect(response.cookies.get("next-auth.session-token.1")?.value).toBe("");
  });

  it("clears the unchunked cookie when the session no longer fits in one", async () => {
    encodeMock.mockResolvedValueOnce("y".repeat(5000));
    const req = new NextRequest("http://localhost:3000/api/admin/clients");
    req.cookies.set("next-auth.session-token", "previous");
    const response = NextResponse.json({});

    await persistSession(req, response, { accessToken: "a" });

    expect(response.cookies.get("next-auth.session-token.0")?.value).toHaveLength(4096 - 163);
    expect(response.cookies.get("next-auth.session-token.1")).toBeDefined();
    expect(response.cookies.get("next-auth.session-token")?.value).toBe("");
  });
});
