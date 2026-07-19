import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/role-permissions/${encodeURIComponent(token)}`);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const body = await req.text();
  return proxyApiRequest(req, `/api/role-permissions/${encodeURIComponent(token)}`, {
    method: "PUT",
    body,
  });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/role-permissions/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
