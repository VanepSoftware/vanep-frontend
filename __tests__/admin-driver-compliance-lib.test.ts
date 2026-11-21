import { describe, expect, it } from "vitest";

import { readApiProblem } from "@/lib/admin/api-problem";
import { problemMessage } from "@/lib/admin/driver-compliance/messages";
import { adminFileUrl, submissionDataUrl, submissionStatusUrl } from "@/lib/admin/driver-compliance/urls";

function problem(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

describe("readApiProblem", () => {
  it("reads the stable code and the translated detail", async () => {
    const result = await readApiProblem(
      problem(409, { status: 409, code: "document.review.stale", detail: "Mudou." }),
    );
    expect(result).toEqual({
      status: 409,
      code: "document.review.stale",
      detail: "Mudou.",
      field: null,
      errors: [],
      blockers: [],
    });
  });

  it("carries the blockers of a refused approval", async () => {
    const blockers = [
      {
        kind: "VEHICLE_REQUIREMENT",
        requirement: "VEHICLE_INSPECTION",
        state: "PENDING",
        vehicleToken: "v1",
        plate: "ABC1D23",
      },
    ];
    const result = await readApiProblem(
      problem(422, { code: "driver.onboarding.documents_not_approved", blockers }),
    );
    expect(result.code).toBe("driver.onboarding.documents_not_approved");
    expect(result.blockers).toEqual(blockers);
  });

  it("translates the lock race outside document decisions", async () => {
    const result = await readApiProblem(problem(409, { code: "request.conflict", detail: "Conflito." }));
    expect(result.code).toBe("request.conflict");
    expect(problemMessage(result)).toBe(
      "O cadastro mudou enquanto você decidia. Confira a versão atual e tente de novo.",
    );
  });

  it("reads the field of a rule error and the format errors of the body", async () => {
    const rule = await readApiProblem(
      problem(400, { code: "document.review.field_required", detail: "Falta.", field: "expiresAt" }),
    );
    expect(rule).toMatchObject({ code: "document.review.field_required", field: "expiresAt", errors: [] });

    const format = await readApiProblem(
      problem(400, {
        detail: "A categoria da CNH deve ser D, E, AD ou AE.",
        field: "category",
        errors: [
          { field: "category", message: "A categoria da CNH deve ser D, E, AD ou AE." },
          { field: "issuingState", message: "UF emissora inválida." },
          { message: "Sem campo." },
          { field: "x" },
          "lixo",
        ],
      }),
    );
    expect(format.code).toBeNull();
    expect(format.errors).toEqual([
      { field: "category", message: "A categoria da CNH deve ser D, E, AD ou AE." },
      { field: "issuingState", message: "UF emissora inválida." },
      { field: null, message: "Sem campo." },
    ]);
  });

  it("ignores codes the screen does not know", async () => {
    const result = await readApiProblem(problem(400, { code: "location.cep.invalid", detail: "CEP" }));
    expect(result.code).toBeNull();
    expect(result.detail).toBe("CEP");
  });

  it("keeps only the status when the body is empty or not JSON", async () => {
    expect(await readApiProblem(problem(403))).toEqual({
      status: 403,
      code: null,
      detail: null,
      field: null,
      errors: [],
      blockers: [],
    });
    expect((await readApiProblem(new Response("<html>", { status: 502 }))).status).toBe(502);
  });
});

describe("problemMessage", () => {
  const base = { field: null, errors: [], blockers: [] };

  it("uses the screen's text for a known code", () => {
    expect(
      problemMessage({ ...base, status: 409, code: "document.review.stale", detail: "x" }),
    ).toContain("Recarregue");
  });

  it("explains a missing permission", () => {
    expect(problemMessage({ ...base, status: 403, code: null, detail: null })).toBe(
      "Você não tem permissão para fazer isso.",
    );
  });

  it("falls back to the API's detail, then to a generic text", () => {
    expect(problemMessage({ ...base, status: 400, code: null, detail: "Da API" })).toBe("Da API");
    expect(problemMessage({ ...base, status: 500, code: null, detail: null })).toBe(
      "Algo deu errado. Tente de novo.",
    );
  });
});

describe("urls", () => {
  it("maps each kind of submission to its data correction route", () => {
    expect(submissionDataUrl("DRIVER_DOCUMENT", "a b")).toBe("/api/admin/driver-documents/a%20b/data");
    expect(submissionDataUrl("VEHICLE_DOCUMENT", "t")).toBe("/api/admin/vehicle-documents/t/data");
    expect(submissionDataUrl("DRIVER_CNH", "t")).toBe("/api/admin/driver-cnhs/t/data");
  });


  it("maps each kind of submission to its decision route", () => {
    expect(submissionStatusUrl("DRIVER_DOCUMENT", "a b")).toBe(
      "/api/admin/driver-documents/a%20b/status",
    );
    expect(submissionStatusUrl("VEHICLE_DOCUMENT", "t")).toBe("/api/admin/vehicle-documents/t/status");
    expect(submissionStatusUrl("DRIVER_CNH", "t")).toBe("/api/admin/driver-cnhs/t/status");
  });

  it.each([
    ["/api/driver-documents/t1/file?v=m1", "/api/admin/driver-documents/t1/file?v=m1"],
    ["/api/vehicle-documents/t1/file?v=m1", "/api/admin/vehicle-documents/t1/file?v=m1"],
    ["/api/driver-cnhs/t1/file?v=m1", "/api/admin/driver-cnhs/t1/file?v=m1"],
    ["/api/driver-cnhs/t1/file", "/api/admin/driver-cnhs/t1/file"],
  ])("opens %s through the admin proxy", (fileUrl, expected) => {
    expect(adminFileUrl(fileUrl)).toBe(expected);
  });

  it.each([
    null,
    "",
    "https://evil.test/api/driver-documents/t1/file",
    "/api/drivers/t1/photo",
    "/api/driver-documents/t1/file/../../roles",
    "/api/driver-documents/../file",
    "/api/driver-cnhs/t1/file?v=../x",
    // A rota antiga da CNH: o back responde 404.
    "/api/driver-cnhs/t1/photo",
    "/api/driver-documents/t1/file?v=m1&x=2",
  ])("refuses %s", (fileUrl) => {
    expect(adminFileUrl(fileUrl)).toBeNull();
  });
});
