import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/clients/${encodeURIComponent(token)}`);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/clients/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
