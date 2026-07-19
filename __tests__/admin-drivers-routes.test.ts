import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", () => ({
  proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
}));

import { GET as listDrivers } from "@/app/api/admin/drivers/route";
import {
  DELETE as deleteDriver,
  GET as getDriver,
} from "@/app/api/admin/drivers/[token]/route";
import { proxyApiRequest } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);

describe("admin drivers routes", () => {
  beforeEach(() => proxyMock.mockClear());

  it("proxies the paginated list with page and size", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers?page=3&size=25");
    await listDrivers(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers?page=3&size=25");
  });

  it("defaults pagination when params are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers");
    await listDrivers(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers?page=0&size=10");
  });

  it("proxies show with the encoded token", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/tok-1");
    await getDriver(req, { params: Promise.resolve({ token: "tok 1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok%201");
  });

  it("proxies delete with the DELETE method", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/tok-1", {
      method: "DELETE",
    });
    await deleteDriver(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok-1", { method: "DELETE" });
  });
});
