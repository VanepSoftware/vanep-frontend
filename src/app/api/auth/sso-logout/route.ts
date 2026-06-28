import { NextResponse } from "next/server";

export async function GET() {
  const authUrl = process.env.AUTH_URL;
  const frontendUrl = process.env.NEXTAUTH_URL;

  if (!authUrl || !frontendUrl) {
    return new Response("AUTH_URL and NEXTAUTH_URL must be set", { status: 500 });
  }

  const target = `${authUrl}/auth/sso-logout?redirect_uri=${encodeURIComponent(frontendUrl)}`;
  return NextResponse.redirect(target);
}
