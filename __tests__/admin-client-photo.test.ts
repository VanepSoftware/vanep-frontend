import { describe, expect, it } from "vitest";

import {
  CLIENT_PHOTO_MAX_SIZE_BYTES,
  validateClientPhoto,
} from "@/lib/admin/client-photo";

describe("validateClientPhoto", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(validateClientPhoto({ type, size: CLIENT_PHOTO_MAX_SIZE_BYTES })).toBeNull();
  });

  it("rejects an unsupported image type", () => {
    expect(validateClientPhoto({ type: "image/gif", size: 1 })).toBe("invalid-type");
  });

  it("rejects a photo larger than 5 MB", () => {
    expect(
      validateClientPhoto({ type: "image/jpeg", size: CLIENT_PHOTO_MAX_SIZE_BYTES + 1 }),
    ).toBe("too-large");
  });
});
