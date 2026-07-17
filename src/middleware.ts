import type { JWT } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";

type AuthorizedParams = {
  req: { nextUrl: { pathname: string } };
  token: JWT | null;
};

export function isAuthorized({ req, token }: AuthorizedParams): boolean {
  if (!token) return false;
  if (req.nextUrl.pathname.startsWith("/admin")) {
    return token.userType === "ADMIN";
  }
  return true;
}

export default withAuth({
  pages: { signIn: "/" },
  callbacks: {
    authorized: ({ req, token }) => isAuthorized({ req, token }),
  },
});

export const config = {
  matcher: ["/conta/:path*", "/dashboard/:path*", "/admin/:path*"],
};
