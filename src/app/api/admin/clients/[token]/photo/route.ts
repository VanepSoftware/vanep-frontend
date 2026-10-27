import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { proxyBinaryDownload, proxyMultipartUpload } from "@/lib/server/api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  return proxyBinaryDownload(req, `/api/clients/${encodeURIComponent(token)}/photo`);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.set("file", file, file.name);
  return proxyMultipartUpload(req, `/api/clients/${encodeURIComponent(token)}/photo`, upstream);
}
