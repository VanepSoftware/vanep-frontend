import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

export async function GET(req: NextRequest) {
  return proxyApiRequest(req, "/api/permissions");
}
