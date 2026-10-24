import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const body = await req.text();
  return proxyApiRequest(req, `/api/driver-documents/${encodeURIComponent(token)}/status`, {
    method: "PUT",
    body,
  });
}
