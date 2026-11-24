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
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "File is required.",
        code: "validation.failed",
        field: "file",
        errors: [{ field: "file", code: "validation.failed", message: "file is required" }],
        error: "file is required",
      },
      {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  }

  const upstream = new FormData();
  upstream.set("file", file, file.name);
  return proxyMultipartUpload(req, `/api/clients/${encodeURIComponent(token)}/photo`, upstream);
}
