import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/api")>();
  return {
    withMediaVersion: actual.withMediaVersion,
    proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
    proxyBinaryDownload: vi.fn(async () => new NextResponse(null, { status: 200 })),
  };
});

import { GET as listQueue } from "@/app/api/admin/drivers/compliance/route";
import { GET as getCounts } from "@/app/api/admin/drivers/compliance/counts/route";
import { GET as getDriverCompliance } from "@/app/api/admin/drivers/[token]/compliance/route";
import { POST as approveDriver } from "@/app/api/admin/drivers/[token]/approve/route";
import { POST as rejectDriver } from "@/app/api/admin/drivers/[token]/reject/route";
import { PUT as decideDriverDocument } from "@/app/api/admin/driver-documents/[token]/status/route";
import { PUT as decideVehicleDocument } from "@/app/api/admin/vehicle-documents/[token]/status/route";
import { PUT as decideCnh } from "@/app/api/admin/driver-cnhs/[token]/status/route";
import { GET as driverDocumentFile } from "@/app/api/admin/driver-documents/[token]/file/route";
import { GET as vehicleDocumentFile } from "@/app/api/admin/vehicle-documents/[token]/file/route";
import { GET as cnhFile } from "@/app/api/admin/driver-cnhs/[token]/file/route";
import { proxyApiRequest, proxyBinaryDownload } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);
const binaryMock = vi.mocked(proxyBinaryDownload);

const BASE = "http://localhost:3000/api/admin";
const ctx = (token: string) => ({ params: Promise.resolve({ token }) });

describe("admin driver compliance routes", () => {
  beforeEach(() => {
    proxyMock.mockClear();
    binaryMock.mockClear();
  });

  describe("queue", () => {
    it("forwards view, search and pagination", async () => {
      const req = new NextRequest(`${BASE}/drivers/compliance?view=EXPIRING&q=abc-1d23&page=2&size=20`);
      await listQueue(req);
      expect(proxyMock).toHaveBeenCalledWith(
        req,
        "/api/drivers/compliance?view=EXPIRING&q=abc-1d23&page=2&size=20",
      );
    });

    it("leaves out filters that were not sent, so the API defaults apply", async () => {
      const req = new NextRequest(`${BASE}/drivers/compliance?q=&foo=bar`);
      await listQueue(req);
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/compliance");
    });

    it("encodes the search", async () => {
      const req = new NextRequest(`${BASE}/drivers/compliance?q=${encodeURIComponent("ana & cia")}`);
      await listQueue(req);
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/compliance?q=ana+%26+cia");
    });

    it("proxies the counts", async () => {
      const req = new NextRequest(`${BASE}/drivers/compliance/counts`);
      await getCounts(req);
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/compliance/counts");
    });
  });

  describe("driver", () => {
    it("proxies the driver's page with the encoded token", async () => {
      const req = new NextRequest(`${BASE}/drivers/tok%201/compliance`);
      await getDriverCompliance(req, ctx("tok 1"));
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok%201/compliance");
    });

    it("approves with POST and no body", async () => {
      const req = new NextRequest(`${BASE}/drivers/tok/approve`, { method: "POST" });
      await approveDriver(req, ctx("tok"));
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok/approve", { method: "POST" });
    });

    it("rejects with POST and forwards the reason", async () => {
      const body = JSON.stringify({ reasonCode: "OTHER", reason: "Documentos de outra pessoa" });
      const req = new NextRequest(`${BASE}/drivers/tok/reject`, { method: "POST", body });
      await rejectDriver(req, ctx("tok"));
      expect(proxyMock).toHaveBeenCalledWith(req, "/api/drivers/tok/reject", {
        method: "POST",
        body,
      });
    });
  });

  describe("submission decisions", () => {
    const body = JSON.stringify({ status: "APPROVED", version: 3 });

    it.each([
      ["driver document", decideDriverDocument, "/api/driver-documents/tok/status"],
      ["vehicle document", decideVehicleDocument, "/api/vehicle-documents/tok/status"],
      ["CNH", decideCnh, "/api/driver-cnhs/tok/status"],
    ] as const)("puts the %s status with the version", async (_name, handler, path) => {
      const req = new NextRequest(`${BASE}${path.replace("/api", "")}`, { method: "PUT", body });
      await handler(req, ctx("tok"));
      expect(proxyMock).toHaveBeenCalledWith(req, path, { method: "PUT", body });
    });
  });

  describe("files", () => {
    it.each([
      ["driver document", driverDocumentFile, "/api/driver-documents/tok/file"],
      ["vehicle document", vehicleDocumentFile, "/api/vehicle-documents/tok/file"],
      ["CNH file", cnhFile, "/api/driver-cnhs/tok/file"],
    ] as const)("downloads the %s keeping the media version", async (_name, handler, path) => {
      const req = new NextRequest(`${BASE}${path.replace("/api", "")}?v=media-1`);
      await handler(req, ctx("tok"));
      expect(binaryMock).toHaveBeenCalledWith(req, `${path}?v=media-1`);
    });

    it("downloads without version when the URL has none", async () => {
      const req = new NextRequest(`${BASE}/driver-documents/tok/file`);
      await driverDocumentFile(req, ctx("tok"));
      expect(binaryMock).toHaveBeenCalledWith(req, "/api/driver-documents/tok/file");
    });
  });
});
