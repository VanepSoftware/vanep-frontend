import { describe, expect, it } from "vitest";

import type { ApiProblem } from "@/lib/admin/api-problem";
import {
  CNH_CATEGORIES,
  dataBody,
  dataFields,
  dataValues,
  firstErrorField,
  isExpiryField,
  normalizeInput,
  problemFieldErrors,
  validateData,
} from "@/lib/admin/driver-compliance/submission-data";

import { TODAY, cnhSubmission, documentSubmission } from "./fixtures/driver-compliance";

const required = (kind: Parameters<typeof dataFields>[0], requirement: Parameters<typeof dataFields>[1]) =>
  dataFields(kind, requirement)
    .filter((spec) => spec.required)
    .map((spec) => spec.name);

function problem(overrides: Partial<ApiProblem>): ApiProblem {
  return { status: 400, code: null, detail: null, field: null, errors: [], blockers: [], ...overrides };
}

describe("dataFields", () => {
  it("asks each document type for what the API requires on approval", () => {
    expect(required("VEHICLE_DOCUMENT", "VEHICLE_REGISTRATION")).toEqual(["expiresAt"]);
    expect(required("VEHICLE_DOCUMENT", "VEHICLE_INSPECTION")).toEqual(["expiresAt"]);
    expect(required("VEHICLE_DOCUMENT", "SCHOOL_VEHICLE_AUTHORIZATION")).toEqual(["documentNumber", "expiresAt"]);
    expect(required("DRIVER_DOCUMENT", "MUNICIPAL_AUTHORIZATION")).toEqual(["documentNumber"]);
    expect(required("DRIVER_DOCUMENT", "SCHOOL_DRIVER_COURSE")).toEqual([]);
    expect(required("DRIVER_DOCUMENT", "CRIMINAL_RECORD")).toEqual([]);
    expect(dataFields("DRIVER_DOCUMENT", "CRIMINAL_RECORD").map((spec) => spec.name)).toEqual([
      "documentNumber",
      "expiresAt",
    ]);
  });

  it("asks the CNH for its own data, with the school transport categories", () => {
    const fields = dataFields("DRIVER_CNH", "DRIVER_LICENSE");
    expect(fields.map((spec) => spec.name)).toEqual([
      "registrationNumber",
      "category",
      "issueDate",
      "validUntil",
      "firstLicenseDate",
      "issuingState",
      "securityNumber",
    ]);
    expect(required("DRIVER_CNH", "DRIVER_LICENSE")).toEqual(["registrationNumber", "category", "issueDate", "validUntil"]);
    expect(fields.find((spec) => spec.name === "category")?.options).toEqual(CNH_CATEGORIES);
    expect(fields.find((spec) => spec.name === "issuingState")?.options).toHaveLength(27);
  });

  it("treats the CNH validity as its expiry", () => {
    expect(isExpiryField("validUntil")).toBe(true);
    expect(isExpiryField("expiresAt")).toBe(true);
    expect(isExpiryField("issueDate")).toBe(false);
  });
});

describe("dataValues", () => {
  it("starts empty on a pending submission", () => {
    expect(dataValues(documentSubmission())).toEqual({ documentNumber: "", expiresAt: "" });
    expect(Object.values(dataValues(cnhSubmission({
      status: "PENDING",
      registrationNumber: null,
      category: null,
      issueDate: null,
      expiresAt: null,
      firstLicenseDate: null,
      issuingState: null,
    })))).toEqual(["", "", "", "", "", "", ""]);
  });

  it("fills every field of an approved CNH, so a correction keeps the optional ones", () => {
    expect(dataValues(cnhSubmission())).toEqual({
      registrationNumber: "01234566789",
      category: "D",
      issueDate: "2024-03-10",
      validUntil: "2029-03-10",
      firstLicenseDate: "2015-06-02",
      issuingState: "DF",
      securityNumber: "",
    });
  });
});

describe("normalizeInput", () => {
  const [registration] = dataFields("DRIVER_CNH", "DRIVER_LICENSE");
  const [number] = dataFields("DRIVER_DOCUMENT", "CRIMINAL_RECORD");
  const security = dataFields("DRIVER_CNH", "DRIVER_LICENSE").find((spec) => spec.name === "securityNumber")!;

  it("keeps only digits, up to the size of the field", () => {
    expect(normalizeInput(registration, "012.345.667-89 99")).toBe("01234566789");
    expect(normalizeInput(security, "12 34a")).toBe("1234");
    expect(normalizeInput(number, " CERT-1 ")).toBe(" CERT-1 ");
  });
});

describe("validateData", () => {
  const cnh = dataFields("DRIVER_CNH", "DRIVER_LICENSE");
  const filled = dataValues(cnhSubmission());

  it("accepts a complete CNH", () => {
    expect(validateData(cnh, filled, TODAY, { allowPast: false })).toEqual({});
  });

  it("marks the required fields left blank", () => {
    const errors = validateData(cnh, { ...filled, category: " ", issueDate: "" }, TODAY, { allowPast: false });
    expect(Object.keys(errors)).toEqual(["category", "issueDate"]);
    expect(errors.category?.message).toBe("Preencha este campo.");
  });

  it("checks the registration size and the dates", () => {
    const errors = validateData(
      cnh,
      { ...filled, registrationNumber: "12345678", issueDate: "2026-11-15", firstLicenseDate: "2026-12-01" },
      TODAY,
      { allowPast: false },
    );
    expect(errors.registrationNumber?.message).toBe("O registro tem de 9 a 11 dígitos.");
    expect(errors.issueDate?.message).toBe("Não pode ser uma data futura.");
    expect(errors.firstLicenseDate?.message).toBe("Não pode ser uma data futura.");
  });

  it("refuses to approve an expired document, but lets a correction keep a past date", () => {
    const expired = { ...filled, validUntil: "2026-11-13" };
    expect(validateData(cnh, expired, TODAY, { allowPast: false }).validUntil).toEqual({
      message: "Documento vencido não pode ser aprovado.",
      expired: true,
    });
    expect(validateData(cnh, expired, TODAY, { allowPast: true })).toEqual({});
    const today = { ...filled, validUntil: TODAY };
    expect(validateData(cnh, today, TODAY, { allowPast: false })).toEqual({});
  });

  it("refuses a date typed halfway or that does not exist", () => {
    const errors = validateData(cnh, { ...filled, issueDate: "10/03/20", firstLicenseDate: "31/02/2015" }, TODAY, {
      allowPast: false,
    });
    expect(errors.issueDate?.message).toBe("Data inválida. Use dd/mm/aaaa.");
    expect(errors.firstLicenseDate?.message).toBe("Data inválida. Use dd/mm/aaaa.");
  });

  it("leaves optional fields alone when blank", () => {
    const fields = dataFields("DRIVER_DOCUMENT", "CRIMINAL_RECORD");
    expect(validateData(fields, {}, TODAY, { allowPast: false })).toEqual({});
  });
});

describe("dataBody", () => {
  it("trims the values and leaves the blank ones out", () => {
    const fields = dataFields("DRIVER_DOCUMENT", "MUNICIPAL_AUTHORIZATION");
    expect(dataBody(fields, { documentNumber: "  ALV-77 ", expiresAt: "" })).toEqual({ documentNumber: "ALV-77" });
  });

  it("sends every CNH field that has a value", () => {
    const fields = dataFields("DRIVER_CNH", "DRIVER_LICENSE");
    expect(dataBody(fields, dataValues(cnhSubmission()))).toEqual({
      registrationNumber: "01234566789",
      category: "D",
      issueDate: "2024-03-10",
      validUntil: "2029-03-10",
      firstLicenseDate: "2015-06-02",
      issuingState: "DF",
    });
  });
});

describe("problemFieldErrors", () => {
  const cnh = dataFields("DRIVER_CNH", "DRIVER_LICENSE");
  const documentFields = dataFields("VEHICLE_DOCUMENT", "VEHICLE_REGISTRATION");

  it("puts a rule error on its field, with the screen's text", () => {
    expect(
      problemFieldErrors(problem({ code: "document.expires_at.too_far", field: "expiresAt", detail: "x" }), documentFields),
    ).toEqual({
      expiresAt: {
        message: "Essa validade passa do limite deste documento. Confira a data no arquivo.",
        expired: false,
      },
    });
    expect(
      problemFieldErrors(problem({ code: "document.expires_at.past", field: "validUntil" }), cnh).validUntil?.expired,
    ).toBe(true);
  });

  it("puts a duplicated CNH number on the registration even without a field", () => {
    expect(problemFieldErrors(problem({ status: 409, code: "driver_cnh.registration.duplicate" }), cnh)).toEqual({
      registrationNumber: { message: "Este número de CNH já é de outro motorista.", expired: false },
    });
  });

  it("marks every format error of the body with the API's own text", () => {
    const errors = problemFieldErrors(
      problem({
        field: "category",
        detail: "A categoria da CNH deve ser D, E, AD ou AE.",
        errors: [
          { field: "category", message: "A categoria da CNH deve ser D, E, AD ou AE." },
          { field: "issuingState", message: "UF emissora inválida." },
          { field: null, message: "Sem campo." },
        ],
      }),
      cnh,
    );
    expect(errors).toEqual({
      category: { message: "A categoria da CNH deve ser D, E, AD ou AE." },
      issuingState: { message: "UF emissora inválida." },
    });
    expect(firstErrorField(cnh, errors)).toBe("category");
  });

  it("uses the detail of a lone field error without a code", () => {
    expect(problemFieldErrors(problem({ field: "documentNumber", detail: "Grande demais." }), documentFields)).toEqual({
      documentNumber: { message: "Grande demais." },
    });
  });

  it("leaves out what does not belong to the form", () => {
    expect(problemFieldErrors(problem({ code: "document.review.field_required", field: "category" }), documentFields)).toEqual({});
    expect(problemFieldErrors(problem({ code: "document.review.stale", field: "expiresAt" }), documentFields)).toEqual({});
    expect(problemFieldErrors(problem({ code: "document.review.field_required", detail: "x" }), documentFields)).toEqual({});
    expect(firstErrorField(cnh, {})).toBeNull();
  });
});
