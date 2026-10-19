import type { NextRequest } from "next/server";

import { proxyBinaryRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyBinaryRequest(req, `/api/driver-documents/${encodeURIComponent(token)}/file`);
}
