import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({
  encode: vi.fn(async () => "encoded"),
}));

import { encode } from "next-auth/jwt";

import { chunkSessionValue, persistSession } from "@/lib/server/session-cookie";

const encodeMock = vi.mocked(encode);
const CHUNK_SIZE = 4096 - 163;

function restoreEnv(name: "NEXTAUTH_URL" | "AUTH_SECRET", previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

describe("chunkSessionValue", () => {
  it("keeps a small session in a single cookie", () => {
    expect(chunkSessionValue("session", "short")).toEqual([{ name: "session", value: "short" }]);
  });

  it("keeps a value that fills the chunk budget in one cookie", () => {
    const value = "x".repeat(CHUNK_SIZE);

    expect(chunkSessionValue("session", value)).toEqual([{ name: "session", value }]);
  });

  it("splits the first byte past the budget and preserves the value in order", () => {
    const value = "x".repeat(CHUNK_SIZE + 1);

    const chunks = chunkSessionValue("session", value);

    expect(chunks.map((chunk) => chunk.name)).toEqual(["session.0", "session.1"]);
    expect(chunks[0]?.value).toHaveLength(CHUNK_SIZE);
    expect(chunks.map((chunk) => chunk.value).join("")).toBe(value);
  });
});

describe("persistSession", () => {
  let previousUrl: string | undefined;
  let previousSecret: string | undefined;

  beforeEach(() => {
    previousUrl = process.env.NEXTAUTH_URL;
    previousSecret = process.env.AUTH_SECRET;
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.AUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    restoreEnv("NEXTAUTH_URL", previousUrl);
    restoreEnv("AUTH_SECRET", previousSecret);
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
    expect(encodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: "test-secret",
        token: { accessToken: "a", refreshToken: "r" },
      }),
    );
  });

  it("uses the secure cookie name behind https", async () => {
    process.env.NEXTAUTH_URL = "https://app.vanep.com.br";
    const req = new NextRequest("https://app.vanep.com.br/api/admin/clients");
    req.cookies.set("__Secure-next-auth.session-token.0", "old");
    const response = NextResponse.json({});

    await persistSession(req, response, { accessToken: "a" });

    const cookie = response.cookies.get("__Secure-next-auth.session-token");
    expect(cookie?.value).toBe("encoded");
    expect(cookie?.secure).toBe(true);
    const cleared = response.cookies.get("__Secure-next-auth.session-token.0");
    expect(cleared?.value).toBe("");
    expect(cleared?.secure).toBe(true);
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

    expect(response.cookies.get("next-auth.session-token.0")?.value).toHaveLength(CHUNK_SIZE);
    expect(response.cookies.get("next-auth.session-token.1")).toBeDefined();
    expect(response.cookies.get("next-auth.session-token")?.value).toBe("");
  });
});
