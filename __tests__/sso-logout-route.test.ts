import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/sso-logout/route";

describe("sso-logout route", () => {
  let prev: { authUrl?: string; frontendUrl?: string };

  beforeEach(() => {
    prev = { authUrl: process.env.AUTH_URL, frontendUrl: process.env.NEXTAUTH_URL };
  });

  afterEach(() => {
    process.env.AUTH_URL = prev.authUrl;
    process.env.NEXTAUTH_URL = prev.frontendUrl;
  });

  it("returns 500 when the required env vars are missing", async () => {
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.text()).toContain("AUTH_URL and NEXTAUTH_URL must be set");
  });

  it("redirects to the backend sso-logout with the encoded frontend url", async () => {
    process.env.AUTH_URL = "http://backend";
    process.env.NEXTAUTH_URL = "http://localhost:3000";

    const res = await GET();

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://backend/auth/sso-logout?redirect_uri=http%3A%2F%2Flocalhost%3A3000",
    );
  });
});
