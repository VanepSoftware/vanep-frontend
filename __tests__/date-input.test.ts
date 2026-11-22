import { describe, expect, it } from "vitest";

import { dateToIso, displayDate, isIsoDate, isoToDate, typedDate } from "@/lib/date-input";

describe("date input", () => {
  it("puts the slashes while typing and becomes ISO when complete", () => {
    expect(typedDate("1")).toBe("1");
    expect(typedDate("100")).toBe("10/0");
    expect(typedDate("1003202")).toBe("10/03/202");
    expect(typedDate("10032029")).toBe("2029-03-10");
    expect(typedDate("10/03/2029")).toBe("2029-03-10");
    expect(typedDate("10/03/20291")).toBe("2029-03-10");
    expect(typedDate("")).toBe("");
  });

  it("keeps a date that does not exist as text, for the validation to refuse", () => {
    expect(typedDate("31022024")).toBe("31/02/2024");
    expect(isIsoDate("2024-02-31")).toBe(false);
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("10/03/2029")).toBe(false);
  });

  it("shows the ISO as dd/mm/aaaa and leaves partial text alone", () => {
    expect(displayDate("2029-03-10")).toBe("10/03/2029");
    expect(displayDate("10/03")).toBe("10/03");
  });

  it("converts to and from the calendar's local date", () => {
    expect(isoToDate("2029-03-10")?.getDate()).toBe(10);
    expect(isoToDate("10/03")).toBeUndefined();
    expect(dateToIso(new Date(2029, 2, 5))).toBe("2029-03-05");
  });
});
