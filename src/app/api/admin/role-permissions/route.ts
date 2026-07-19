import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") ?? "0";
  const size = req.nextUrl.searchParams.get("size") ?? "20";
  return proxyApiRequest(
    req,
    `/api/role-permissions?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`,
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyApiRequest(req, "/api/role-permissions", { method: "POST", body });
}
