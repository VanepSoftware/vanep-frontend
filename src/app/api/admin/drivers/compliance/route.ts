import type { NextRequest } from "next/server";

import { proxyApiRequest } from "@/lib/server/api";

const FORWARDED = ["view", "q", "page", "size"] as const;

/** Fila de revisão: repassa só os filtros que a API conhece, quando vierem. */
export async function GET(req: NextRequest) {
  const query = new URLSearchParams();
  for (const name of FORWARDED) {
    const value = req.nextUrl.searchParams.get(name);
    if (value) query.set(name, value);
  }
  const suffix = query.size > 0 ? `?${query}` : "";
  return proxyApiRequest(req, `/api/drivers/compliance${suffix}`);
}
