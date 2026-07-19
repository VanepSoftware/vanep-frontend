import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") ?? "0";
  const size = req.nextUrl.searchParams.get("size") ?? "10";
  return proxyApiRequest(
    req,
    `/api/drivers?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`,
  );
}
