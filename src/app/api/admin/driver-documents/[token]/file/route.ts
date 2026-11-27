import type { NextRequest } from "next/server";

import { proxyBinaryDownload, withMediaVersion } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyBinaryDownload(
    req,
    withMediaVersion(req, `/api/driver-documents/${encodeURIComponent(token)}/file`),
  );
}
