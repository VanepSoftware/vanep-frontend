import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("nextauth route", () => {
  it("exposes GET and POST handlers", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });
});
