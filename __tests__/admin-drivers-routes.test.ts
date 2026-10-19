import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", () => ({
  proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
  proxyBinaryRequest: vi.fn(async () => new NextResponse(new Uint8Array([1, 2, 3]), { status: 200 })),
}));

import { GET as getDocumentFile } from "@/app/api/admin/driver-documents/[token]/file/route";
import { PUT as updateDocumentStatus } from "@/app/api/admin/driver-documents/[token]/status/route";
import { POST as approveDriver } from "@/app/api/admin/drivers/[token]/approve/route";
import { GET as listDriverDocuments } from "@/app/api/admin/drivers/[token]/documents/route";
import { POST as rejectDriver } from "@/app/api/admin/drivers/[token]/reject/route";
import {
  DELETE as deleteDriver,
  GET as getDriver,
} from "@/app/api/admin/drivers/[token]/route";
import { GET as listPendingDrivers } from "@/app/api/admin/drivers/pending/route";
import { GET as listDrivers } from "@/app/api/admin/drivers/route";
import { proxyApiRequest, proxyBinaryRequest } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);
const proxyBinaryMock = vi.mocked(proxyBinaryRequest);

describe("admin drivers routes", () => {
  beforeEach(() => {
    proxyMock.mockClear();
    proxyBinaryMock.mockClear();
  });

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

  it("proxies pending drivers list with page and size", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/pending?page=1&size=15");
    await listPendingDrivers(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/pending?page=1&size=15");
  });

  it("defaults pagination for pending drivers list when params are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/pending");
    await listPendingDrivers(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/pending?page=0&size=10");
  });

  it("proxies driver approval with POST", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/tok-1/approve", {
      method: "POST",
    });
    await approveDriver(req, { params: Promise.resolve({ token: "tok 1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok%201/approve", {
      method: "POST",
    });
  });

  it("proxies driver rejection with POST and body", async () => {
    const body = JSON.stringify({ reason: "Documento ilegível" });
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/tok-1/reject", {
      method: "POST",
      body,
    });
    await rejectDriver(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok-1/reject", {
      method: "POST",
      body,
    });
  });

  it("proxies driver documents list with default pagination", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/drivers/tok-1/documents");
    await listDriverDocuments(req, { params: Promise.resolve({ token: "tok 1" }) });
    expect(proxyMock).toHaveBeenCalledWith(
      req,
      "/api/driver-documents?driverToken=tok%201&page=0&size=50",
    );
  });

  it("proxies driver documents list with custom page and size", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/admin/drivers/tok-1/documents?page=2&size=20",
    );
    await listDriverDocuments(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(
      req,
      "/api/driver-documents?driverToken=tok-1&page=2&size=20",
    );
  });

  it("proxies driver document file download via proxyBinaryRequest", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/driver-documents/doc-1/file");
    await getDocumentFile(req, { params: Promise.resolve({ token: "doc 1" }) });
    expect(proxyBinaryMock).toHaveBeenCalledWith(req, "/api/driver-documents/doc%201/file");
  });

  it("proxies driver document status update with PUT and body", async () => {
    const body = JSON.stringify({ status: "APPROVED", reviewMethod: "MANUAL" });
    const req = new NextRequest("http://localhost:3000/api/admin/driver-documents/doc-1/status", {
      method: "PUT",
      body,
    });
    await updateDocumentStatus(req, { params: Promise.resolve({ token: "doc-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/driver-documents/doc-1/status", {
      method: "PUT",
      body,
    });
  });
});
