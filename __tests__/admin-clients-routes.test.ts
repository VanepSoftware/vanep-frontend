import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", () => ({
  proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
  proxyMultipartUpload: vi.fn(async () => new NextResponse(null, { status: 201 })),
  proxyBinaryDownload: vi.fn(async () => new NextResponse(null, { status: 200 })),
}));

import { GET as listClients } from "@/app/api/admin/clients/route";
import {
  DELETE as deleteClient,
  GET as getClient,
  PATCH as patchClient,
} from "@/app/api/admin/clients/[token]/route";
import {
  GET as getClientPhoto,
  POST as uploadClientPhoto,
} from "@/app/api/admin/clients/[token]/photo/route";
import { proxyApiRequest, proxyBinaryDownload, proxyMultipartUpload } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);
const uploadMock = vi.mocked(proxyMultipartUpload);
const downloadMock = vi.mocked(proxyBinaryDownload);

describe("admin clients routes", () => {
  beforeEach(() => {
    proxyMock.mockClear();
    uploadMock.mockClear();
    downloadMock.mockClear();
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

  it("proxies the delete endpoint with the DELETE method", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1", {
      method: "DELETE",
    });

    await deleteClient(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients/tok-1", { method: "DELETE" });
  });

  it("proxies the partial update forwarding the body", async () => {
    const body = JSON.stringify({ name: "Ana Souza Lima" });
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1", {
      method: "PATCH",
      body,
      headers: { "Content-Type": "application/json" },
    });

    await patchClient(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(proxyMock).toHaveBeenCalledWith(req, "/api/clients/tok-1", {
      method: "PATCH",
      body,
    });
  });

  it("proxies the photo download with the encoded token", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1/photo");

    await getClientPhoto(req, { params: Promise.resolve({ token: "tok 1" }) });

    expect(downloadMock).toHaveBeenCalledWith(req, "/api/clients/tok%201/photo");
  });

  it("forwards the uploaded file to the multipart upload", async () => {
    const file = new File(["fake-bytes"], "foto.png", { type: "image/png" });
    const body = new FormData();
    body.set("file", file);
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1/photo", {
      method: "POST",
      body,
    });

    const res = await uploadClientPhoto(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(res.status).toBe(201);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [, path, forwarded] = uploadMock.mock.calls[0];
    expect(path).toBe("/api/clients/tok-1/photo");
    expect(forwarded.get("file")).toBeInstanceOf(File);
    expect((forwarded.get("file") as File).name).toBe("foto.png");
  });

  it("rejects an upload with no file", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/clients/tok-1/photo", {
      method: "POST",
      body: new FormData(),
    });

    const res = await uploadClientPhoto(req, { params: Promise.resolve({ token: "tok-1" }) });

    expect(res.status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
