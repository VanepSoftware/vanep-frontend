import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxyApiRequest } from "@/lib/server/api";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

vi.mock("@/lib/server/oauth-session", () => ({
  maybeRefreshAccessToken: vi.fn(async (token: unknown) => ({ token, refreshed: false })),
}));

import { getToken } from "next-auth/jwt";
import { maybeRefreshAccessToken } from "@/lib/server/oauth-session";

const getTokenMock = vi.mocked(getToken);
const refreshMock = vi.mocked(maybeRefreshAccessToken);

function request(path = "/api/admin/clients"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("proxyApiRequest", () => {
  const fetchMock = vi.fn();
  let previousAuthUrl: string | undefined;

  beforeEach(() => {
    previousAuthUrl = process.env.AUTH_URL;
    process.env.AUTH_URL = "http://backend.test";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    process.env.AUTH_URL = previousAuthUrl;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session token", async () => {
    getTokenMock.mockResolvedValueOnce(null);

    const response = await proxyApiRequest(request(), "/api/clients");

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the refresh loses the access token", async () => {
    getTokenMock.mockResolvedValueOnce({ accessToken: "expired" });
    refreshMock.mockResolvedValueOnce({ token: { accessToken: undefined }, refreshed: true });

    const response = await proxyApiRequest(request(), "/api/clients");

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the request with the bearer token and propagates the response", async () => {
    getTokenMock.mockResolvedValueOnce({ accessToken: "the-token" });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await proxyApiRequest(request(), "/api/clients?page=0&size=10");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/clients?page=0&size=10",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer the-token" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ content: [] });
  });

  it("propagates backend error statuses", async () => {
    getTokenMock.mockResolvedValueOnce({ accessToken: "the-token" });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
    );

    const response = await proxyApiRequest(request(), "/api/clients");

    expect(response.status).toBe(403);
  });

  it("passes through 204 responses without a body", async () => {
    getTokenMock.mockResolvedValueOnce({ accessToken: "the-token" });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await proxyApiRequest(request(), "/api/clients/tok", { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("sets the json content type when the request has a body", async () => {
    getTokenMock.mockResolvedValueOnce({ accessToken: "the-token" });
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await proxyApiRequest(request(), "/api/clients/tok", {
      method: "PUT",
      body: JSON.stringify({ photo: null }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/clients/tok",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });
});
