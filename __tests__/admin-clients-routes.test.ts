import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", () => ({
  proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
}));

import { GET as listClients } from "@/app/api/admin/clients/route";
import {
  DELETE as deleteClient,
  GET as getClient,
  PUT as updateClient,
} from "@/app/api/admin/clients/[token]/route";
import { proxyApiRequest } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);

describe("admin clients routes", () => {
  beforeEach(() => {
    proxyMock.mockClear();
  });

  it("proxies the paginated list with page and size", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients?page=2&size=5");

    await listClients(req);

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients?page=2&size=5");
  });

  it("defaults pagination when params are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients");

    await listClients(req);

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients?page=0&size=10");
  });

  it("proxies the show endpoint with the encoded token", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1");

    await getClient(req, { params: Promise.resolve({ token: "tok 1" }) });

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients/tok%201");
  });

  it("proxies the update endpoint with the PUT method and body", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Novo Nome" }),
    });

    await updateClient(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients/tok-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Novo Nome" }),
    });
  });

  it("proxies the delete endpoint with the DELETE method", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1", {
      method: "DELETE",
    });

    await deleteClient(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients/tok-1", { method: "DELETE" });
  });
});
