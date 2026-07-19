import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api", () => ({
  proxyApiRequest: vi.fn(async () => NextResponse.json({ ok: true })),
}));

import { GET as listPermissions } from "@/app/api/admin/permissions/route";
import { GET as listBundles, POST as createBundle } from "@/app/api/admin/role-permissions/route";
import {
  DELETE as deleteBundle,
  GET as getBundle,
  PUT as updateBundle,
} from "@/app/api/admin/role-permissions/[token]/route";
import { GET as listRoles, POST as createRole } from "@/app/api/admin/roles/route";
import {
  DELETE as deleteRole,
  GET as getRole,
  PUT as updateRole,
} from "@/app/api/admin/roles/[token]/route";
import { proxyApiRequest } from "@/lib/server/api";

const proxyMock = vi.mocked(proxyApiRequest);

describe("admin permissions route", () => {
  beforeEach(() => proxyMock.mockClear());

  it("proxies the registry listing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/permissions");
    await listPermissions(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/permissions");
  });
});

describe("admin role-permissions routes", () => {
  beforeEach(() => proxyMock.mockClear());

  it("proxies the paginated list with custom params", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions?page=1&size=5");
    await listBundles(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions?page=1&size=5");
  });

  it("defaults pagination when params are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions");
    await listBundles(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions?page=0&size=20");
  });

  it("proxies create with POST and body", async () => {
    const body = JSON.stringify({ name: "Bundle", permissions: ["list_drivers"] });
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions", {
      method: "POST",
      body,
    });
    await createBundle(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions", { method: "POST", body });
  });

  it("proxies show with the encoded token", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions/tok-1");
    await getBundle(req, { params: Promise.resolve({ token: "tok 1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions/tok%201");
  });

  it("proxies update with PUT and body", async () => {
    const body = JSON.stringify({ name: "X", permissions: ["show_driver"] });
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions/tok-1", {
      method: "PUT",
      body,
    });
    await updateBundle(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions/tok-1", {
      method: "PUT",
      body,
    });
  });

  it("proxies delete with DELETE", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/role-permissions/tok-1", {
      method: "DELETE",
    });
    await deleteBundle(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/role-permissions/tok-1", { method: "DELETE" });
  });
});

describe("admin roles routes", () => {
  beforeEach(() => proxyMock.mockClear());

  it("proxies the paginated list", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/roles?page=2&size=15");
    await listRoles(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles?page=2&size=15");
  });

  it("defaults pagination when params are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/roles");
    await listRoles(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles?page=0&size=20");
  });

  it("proxies create with POST and body", async () => {
    const body = JSON.stringify({ name: "Ops", description: "d", rolePermissionToken: "b-1" });
    const req = new NextRequest("http://localhost:3000/api/admin/roles", { method: "POST", body });
    await createRole(req);
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles", { method: "POST", body });
  });

  it("proxies show with the encoded token", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/roles/tok-1");
    await getRole(req, { params: Promise.resolve({ token: "tok 1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles/tok%201");
  });

  it("proxies update with PUT and body", async () => {
    const body = JSON.stringify({ name: "X", description: null, rolePermissionToken: null });
    const req = new NextRequest("http://localhost:3000/api/admin/roles/tok-1", {
      method: "PUT",
      body,
    });
    await updateRole(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles/tok-1", { method: "PUT", body });
  });

  it("proxies delete with DELETE", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/roles/tok-1", { method: "DELETE" });
    await deleteRole(req, { params: Promise.resolve({ token: "tok-1" }) });
    expect(proxyMock).toHaveBeenCalledWith(req, "/api/roles/tok-1", { method: "DELETE" });
  });
});
