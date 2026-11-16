import { describe, expect, it } from "vitest";

import {
  REASON_MAX_LENGTH,
  blockerText,
  blockersSummary,
  canDecideRegistration,
  rejectionMessageError,
} from "@/lib/admin/driver-compliance/decision";

import { driver } from "./fixtures/driver-compliance";

describe("canDecideRegistration", () => {
  it("decides only a registration under review", () => {
    expect(canDecideRegistration(driver())).toBe(true);
    expect(canDecideRegistration(driver({ approvalStatus: "APPROVED" }))).toBe(false);
    expect(canDecideRegistration(driver({ approvalStatus: "REJECTED" }))).toBe(false);
    expect(canDecideRegistration(driver({ approvalStatus: "PENDING" }))).toBe(false);
  });
});

describe("blockersSummary", () => {
  const empty = { requirement: null, state: null, vehicleToken: null, plate: null };
  const document = (state: "PENDING" | "EXPIRED" | "REJECTED" | "MISSING", kind = "DRIVER_REQUIREMENT" as const) => ({
    ...empty,
    kind,
    requirement: "CRIMINAL_RECORD" as const,
    state,
  });

  it("counts the documents when they share a state", () => {
    const six = Array.from({ length: 6 }, () => document("PENDING"));
    expect(blockersSummary(six)).toBe("Para aprovar, faltam 6 documentos pendentes.");
    expect(blockersSummary([document("EXPIRED")])).toBe("Para aprovar, falta 1 documento vencido.");
  });

  it("breaks the count down by state", () => {
    const blockers = [document("MISSING"), document("PENDING"), document("EXPIRED"), document("PENDING")];
    expect(blockersSummary(blockers)).toBe(
      "Para aprovar, faltam 4 documentos (2 pendentes, 1 vencido e 1 não enviado).",
    );
  });

  it("keeps the blockers that are not documents", () => {
    expect(blockersSummary([{ ...empty, kind: "NO_ACTIVE_VEHICLE" }])).toBe(
      "Para aprovar, falta uma van ativa cadastrada.",
    );
    expect(
      blockersSummary([
        document("PENDING"),
        { ...empty, kind: "CNH_CATEGORY", requirement: "DRIVER_LICENSE", state: "APPROVED" },
      ]),
    ).toBe("Para aprovar, faltam 1 documento pendente e CNH com categoria D ou E.");
  });

  it("is empty without blockers", () => {
    expect(blockersSummary([])).toBe("");
  });
});

describe("blockerText", () => {
  const empty = { requirement: null, state: null, vehicleToken: null, plate: null };

  it("names the driver's missing requirement and its state", () => {
    expect(
      blockerText({ ...empty, kind: "DRIVER_REQUIREMENT", requirement: "CRIMINAL_RECORD", state: "PENDING" }),
    ).toBe("Certidão criminal (pendente)");
  });

  it("names the van of a vehicle requirement", () => {
    expect(
      blockerText({
        kind: "VEHICLE_REQUIREMENT",
        requirement: "SCHOOL_VEHICLE_AUTHORIZATION",
        state: "REJECTED",
        vehicleToken: "v1",
        plate: "ABC1D23",
      }),
    ).toBe("Autorização escolar da van ABC-1D23 (reprovado)");
    expect(
      blockerText({ ...empty, kind: "VEHICLE_REQUIREMENT", requirement: "VEHICLE_INSPECTION", state: "MISSING" }),
    ).toBe("Vistoria semestral (não enviado)");
  });

  it("explains the blockers without a requirement", () => {
    expect(blockerText({ ...empty, kind: "NO_ACTIVE_VEHICLE" })).toBe("uma van ativa cadastrada");
    expect(blockerText({ ...empty, kind: "CNH_CATEGORY", requirement: "DRIVER_LICENSE", state: "APPROVED" })).toBe(
      "CNH com categoria D ou E",
    );
    expect(blockerText({ ...empty, kind: "APPROVAL_STATUS" })).toBe("o cadastro estar em análise");
  });

  it("does not break on a blocker without details", () => {
    expect(blockerText({ ...empty, kind: "DRIVER_REQUIREMENT" })).toBe("— (—)");
  });
});

describe("rejectionMessageError", () => {
  it("requires a reason code", () => {
    expect(rejectionMessageError(null, "")).toBe("reasonCode");
  });

  it("requires the message only with another reason", () => {
    expect(rejectionMessageError("DUPLICATE_ACCOUNT", "")).toBeNull();
    expect(rejectionMessageError("ILLEGIBLE", "")).toBeNull();
    expect(rejectionMessageError("OTHER", "   ")).toBe("messageRequired");
    expect(rejectionMessageError("OTHER", "Fraude")).toBeNull();
  });

  it("refuses a message longer than the API accepts", () => {
    expect(rejectionMessageError("ILLEGIBLE", "x".repeat(REASON_MAX_LENGTH))).toBeNull();
    expect(rejectionMessageError("ILLEGIBLE", "x".repeat(REASON_MAX_LENGTH + 1))).toBe("messageTooLong");
  });
});
