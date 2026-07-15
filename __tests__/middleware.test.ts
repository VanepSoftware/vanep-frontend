import { describe, expect, it } from "vitest";

import middleware, { config, isAuthorized } from "@/middleware";

function requestFor(pathname: string) {
  return { nextUrl: { pathname } };
}

describe("middleware", () => {
  it("exports the withAuth middleware handler", () => {
    expect(typeof middleware).toBe("function");
  });

  it("guards the account, dashboard and admin routes", () => {
    expect(config.matcher).toEqual(["/conta/:path*", "/dashboard/:path*", "/admin/:path*"]);
  });
});

describe("isAuthorized", () => {
  it("denies unauthenticated users everywhere", () => {
    expect(isAuthorized({ req: requestFor("/dashboard"), token: null })).toBe(false);
    expect(isAuthorized({ req: requestFor("/admin/clients"), token: null })).toBe(false);
  });

  it("allows any authenticated user outside /admin", () => {
    expect(isAuthorized({ req: requestFor("/dashboard"), token: { userType: "CLIENT" } })).toBe(
      true,
    );
    expect(isAuthorized({ req: requestFor("/conta"), token: {} })).toBe(true);
  });

  it("allows only admins under /admin", () => {
    expect(isAuthorized({ req: requestFor("/admin/clients"), token: { userType: "ADMIN" } })).toBe(
      true,
    );
    expect(isAuthorized({ req: requestFor("/admin/clients"), token: { userType: "CLIENT" } })).toBe(
      false,
    );
    expect(isAuthorized({ req: requestFor("/admin"), token: {} })).toBe(false);
  });
});
