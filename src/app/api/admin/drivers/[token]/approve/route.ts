import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyApiRequest(req, `/api/drivers/${encodeURIComponent(token)}/approve`, {
    method: "POST",
  });
}
