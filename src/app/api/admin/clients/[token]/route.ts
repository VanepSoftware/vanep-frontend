import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/clients/${encodeURIComponent(token)}`);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const body = await req.text();
  return proxyApiRequest(req, `/api/clients/${encodeURIComponent(token)}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/clients/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
