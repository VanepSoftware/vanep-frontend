import { describe, expect, it } from "vitest";

import middleware, { config } from "@/middleware";

describe("middleware", () => {
  it("exports the withAuth middleware handler", () => {
    expect(typeof middleware).toBe("function");
  });

  it("guards the account and dashboard routes", () => {
    expect(config.matcher).toEqual(["/conta/:path*", "/dashboard/:path*"]);
  });
});
