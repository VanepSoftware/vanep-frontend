import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const body = await req.text();
  return proxyApiRequest(req, `/api/drivers/${encodeURIComponent(token)}/reject`, {
    method: "POST",
    body,
  });
}
