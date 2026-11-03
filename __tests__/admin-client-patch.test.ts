import { describe, expect, it } from "vitest";

import {
  buildClientPatch,
  InvalidRatingError,
  isEmptyPatch,
  toEditForm,
  type EditableClient,
} from "@/lib/admin/client-patch";

const original: EditableClient = {
  name: "Ana Souza",
  email: "ana@vanep.com.br",
  rating: 4.5,
  active: true,
};

describe("buildClientPatch", () => {
  it("sends nothing when the form was not touched", () => {
    const patch = buildClientPatch(original, toEditForm(original));

    expect(patch).toEqual({});
    expect(isEmptyPatch(patch)).toBe(true);
  });

  it("sends only the field that changed", () => {
    const form = { ...toEditForm(original), name: "Ana Souza Lima" };

    expect(buildClientPatch(original, form)).toEqual({ name: "Ana Souza Lima" });
  });

  it("leaves every other field untouched when several are edited", () => {
    const form = { ...toEditForm(original), email: "nova@vanep.com.br", active: false };

    const patch = buildClientPatch(original, form);

    expect(patch).toEqual({ email: "nova@vanep.com.br", active: false });
    expect(patch).not.toHaveProperty("name");
    expect(patch).not.toHaveProperty("rating");
  });

  it("clears a field with an explicit null when it is emptied", () => {
    const form = { ...toEditForm(original), email: "   " };

    expect(buildClientPatch(original, form)).toEqual({ email: null });
  });

  it("does not resend a field that only gained surrounding spaces", () => {
    const form = { ...toEditForm(original), name: "  Ana Souza  " };

    expect(buildClientPatch(original, form)).toEqual({});
  });

  it("treats a rating written differently but equal in value as unchanged", () => {
    const form = { ...toEditForm(original), rating: "4.50" };

    expect(buildClientPatch(original, form)).toEqual({});
  });

  it("sends the new rating when it actually changes", () => {
    const form = { ...toEditForm(original), rating: "3" };

    expect(buildClientPatch(original, form)).toEqual({ rating: 3 });
  });

  it("refuses a rating that is not a number or is out of range", () => {
    for (const value of ["abc", "-1", "6"]) {
      const form = { ...toEditForm(original), rating: value };
      expect(() => buildClientPatch(original, form)).toThrow(InvalidRatingError);
    }
  });

  it("fills a field that was null before", () => {
    const empty: EditableClient = {
      name: null,
      email: null,
      rating: null,
      active: false,
    };
    const form = { ...toEditForm(empty), name: "Bruno Lima" };

    expect(buildClientPatch(empty, form)).toEqual({ name: "Bruno Lima" });
  });
});
