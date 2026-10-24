import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const page = req.nextUrl.searchParams.get("page") ?? "0";
  const size = req.nextUrl.searchParams.get("size") ?? "50";
  return proxyApiRequest(
    req,
    `/api/driver-documents?driverToken=${encodeURIComponent(token)}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`,
  );
}
