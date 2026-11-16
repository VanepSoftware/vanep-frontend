import { describe, expect, it } from "vitest";

import {
  DOCUMENT_REJECTION_REASONS,
  ZOOM_STEPS,
  decisionLine,
  doneScenario,
  driverHref,
  findSubmission,
  formatFileSize,
  nextDriverInQueue,
  nextZoom,
  parseKindSlug,
  queuePosition,
  registrationChecks,
  rejectionConsequence,
  reviewEntryHref,
  reviewHref,
  rowSubmission,
  submissionInSentence,
  submissionFacts,
  viewerKind,
} from "@/lib/admin/driver-compliance/review";

import {
  TODAY,
  cnhSubmission,
  detail,
  documentSubmission,
  driver,
  requirement,
  vehicle,
} from "./fixtures/driver-compliance";

describe("routes", () => {
  it("uses the API resource name as the kind in the URL", () => {
    expect(reviewHref("d 1", "DRIVER_DOCUMENT", "t1")).toBe("/admin/drivers/d%201/review/driver-documents/t1");
    expect(reviewHref("d1", "VEHICLE_DOCUMENT", "t1")).toBe("/admin/drivers/d1/review/vehicle-documents/t1");
    expect(reviewHref("d1", "DRIVER_CNH", "t1")).toBe("/admin/drivers/d1/review/driver-cnhs/t1");
    expect(reviewEntryHref("d1")).toBe("/admin/drivers/d1/review");
    expect(driverHref("d1")).toBe("/admin/drivers/d1");
  });

  it("reads the kind back", () => {
    expect(parseKindSlug("driver-documents")).toBe("DRIVER_DOCUMENT");
    expect(parseKindSlug("vehicle-documents")).toBe("VEHICLE_DOCUMENT");
    expect(parseKindSlug("driver-cnhs")).toBe("DRIVER_CNH");
    expect(parseKindSlug("roles")).toBeNull();
  });
});

describe("findSubmission", () => {
  const page = detail();

  it("finds a driver document and a van document", () => {
    expect(findSubmission(page, "DRIVER_DOCUMENT", "doc1")).toMatchObject({
      submission: { token: "doc1" },
      item: { requirement: "CRIMINAL_RECORD" },
      vehicle: null,
    });
    expect(findSubmission(page, "VEHICLE_DOCUMENT", "vst1")).toMatchObject({
      submission: { token: "vst1" },
      item: { requirement: "VEHICLE_INSPECTION" },
      vehicle: { token: "v1" },
    });
    expect(findSubmission(page, "DRIVER_CNH", "cnh1")?.item.requirement).toBe("DRIVER_LICENSE");
  });

  it("finds a renewal pending next to an approval", () => {
    const renewal = documentSubmission({ token: "c2" });
    const withRenewal = detail({
      driverRequirements: [
        requirement("SCHOOL_DRIVER_COURSE", {
          state: "APPROVED",
          current: documentSubmission({ token: "c1", status: "APPROVED" }),
          pending: renewal,
        }),
      ],
    });
    expect(findSubmission(withRenewal, "DRIVER_DOCUMENT", "c2")?.submission).toBe(renewal);
    expect(findSubmission(withRenewal, "DRIVER_DOCUMENT", "c1")?.submission.status).toBe("APPROVED");
  });

  it("does not mix kinds or find a superseded submission", () => {
    expect(findSubmission(page, "VEHICLE_DOCUMENT", "doc1")).toBeNull();
    expect(findSubmission(page, "DRIVER_DOCUMENT", "gone")).toBeNull();
  });
});

describe("rowSubmission", () => {
  const current = documentSubmission({ token: "c1", status: "APPROVED" });
  const pending = documentSubmission({ token: "c2" });
  const queued = detail({
    reviewQueue: [{ kind: "DRIVER_DOCUMENT", token: "c2", requirement: "SCHOOL_DRIVER_COURSE", vehicleToken: null }],
  });

  it("opens the renewal under review first, then what counts", () => {
    expect(rowSubmission(queued, requirement("SCHOOL_DRIVER_COURSE", { current, pending }))).toBe(pending);
    expect(rowSubmission(queued, requirement("SCHOOL_DRIVER_COURSE", { current }))).toBe(current);
    expect(rowSubmission(queued, requirement("SCHOOL_DRIVER_COURSE"))).toBeNull();
  });

  it("keeps what counts while the renewal waits for its file", () => {
    const withoutFile = documentSubmission({ token: "c2", fileUrl: null, file: null });
    const page = detail({ reviewQueue: [] });
    expect(rowSubmission(page, requirement("SCHOOL_DRIVER_COURSE", { current, pending: withoutFile }))).toBe(current);
  });
});

describe("queuePosition", () => {
  it("places the submission in the driver's pending list", () => {
    const page = detail();
    expect(queuePosition(page, "DRIVER_DOCUMENT", "doc1")).toEqual({
      position: 1,
      total: 2,
      previous: null,
      next: page.reviewQueue[1],
    });
    expect(queuePosition(page, "VEHICLE_DOCUMENT", "vst1")).toEqual({
      position: 2,
      total: 2,
      previous: page.reviewQueue[0],
      next: null,
    });
  });

  it("is empty for a submission that is not pending", () => {
    expect(queuePosition(detail(), "DRIVER_CNH", "cnh1")).toBeNull();
  });
});

describe("file", () => {
  it("picks the viewer by type", () => {
    expect(viewerKind("image/webp")).toBe("image");
    expect(viewerKind("application/pdf")).toBe("pdf");
    expect(viewerKind("text/plain")).toBe("other");
    expect(viewerKind(null)).toBe("other");
  });

  it("formats the size", () => {
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(421_888)).toBe("412 KB");
    expect(formatFileSize(1_258_291)).toBe("1,2 MB");
  });

  it("steps the zoom and stops at the ends", () => {
    expect(nextZoom(100, 1)).toBe(125);
    expect(nextZoom(100, -1)).toBe(75);
    expect(nextZoom(110, 1)).toBe(125);
    expect(nextZoom(110, -1)).toBe(100);
    expect(nextZoom(ZOOM_STEPS[ZOOM_STEPS.length - 1], 1)).toBe(300);
    expect(nextZoom(ZOOM_STEPS[0], -1)).toBe(50);
  });
});

describe("submissionFacts", () => {
  it("lists what the driver informed on a document", () => {
    const found = findSubmission(detail(), "DRIVER_DOCUMENT", "doc1")!;
    expect(submissionFacts(found, TODAY)).toEqual([
      { label: "Tipo", value: "Certidão criminal" },
      { label: "Número", value: "CERT-2026-004512" },
      { label: "Validade", value: "14/02/2027", hint: "vence em 92 dias" },
      { label: "Enviado", value: "11/11/2026 às 09:12", hint: "pelo motorista" },
    ]);
  });

  it("lists the CNH's own data", () => {
    const found = findSubmission(detail(), "DRIVER_CNH", "cnh1")!;
    expect(submissionFacts(found, TODAY).map((fact) => fact.label)).toEqual([
      "Tipo",
      "Categoria",
      "Registro",
      "Emissão",
      "Válida até",
      "Enviado",
    ]);
  });

  it("leaves out what was not informed", () => {
    const page = detail({
      driverRequirements: [
        requirement("DRIVER_LICENSE", {
          state: "PENDING",
          current: cnhSubmission({ issueDate: null, expiresAt: null }),
        }),
        requirement("CRIMINAL_RECORD", {
          state: "PENDING",
          current: documentSubmission({ documentNumber: null, expiresAt: null }),
        }),
      ],
    });
    expect(submissionFacts(findSubmission(page, "DRIVER_CNH", "cnh1")!, TODAY)).toHaveLength(4);
    expect(submissionFacts(findSubmission(page, "DRIVER_DOCUMENT", "doc1")!, TODAY)).toHaveLength(2);
  });
});

describe("registrationChecks", () => {
  it("checks a driver document against the person", () => {
    const page = detail();
    const found = findSubmission(page, "DRIVER_DOCUMENT", "doc1")!;
    expect(registrationChecks(page, found, false)).toEqual([
      { label: "Nome", value: "Fábio Teixeira" },
      { label: "CPF", value: "•••.482.•••-10" },
      { label: "Nascimento", value: "17/03/1984" },
    ]);
    expect(registrationChecks(page, found, true)[1].value).toBe("123.482.123-10");
  });

  it("leaves out what the registration lacks", () => {
    const page = detail({ driver: driver({ name: null, document: null, birthDate: null }) });
    const found = findSubmission(page, "DRIVER_DOCUMENT", "doc1")!;
    expect(registrationChecks(page, found, false)).toEqual([{ label: "Nome", value: "Sem nome" }]);
  });

  it("checks a van document against the van", () => {
    const page = detail();
    const found = findSubmission(page, "VEHICLE_DOCUMENT", "vst1")!;
    expect(registrationChecks(page, found, false)).toEqual([
      { label: "Placa", value: "ABC-1D23" },
      { label: "Van", value: "Mercedes-Benz Sprinter 2019 · 16 lugares" },
    ]);
    const bare = detail({ vehicles: [vehicle({ brand: null, model: null, year: null, capacity: null })] });
    expect(registrationChecks(bare, findSubmission(bare, "VEHICLE_DOCUMENT", "vst1")!, false)).toEqual([
      { label: "Placa", value: "ABC-1D23" },
    ]);
  });
});

describe("decisionLine", () => {
  const base = {
    reviewedBy: { token: "u", name: "Ana Souza" },
    reviewedAt: "2026-11-09T18:30:00Z",
    rejectionReason: null,
  };

  it("is empty while pending", () => {
    expect(decisionLine({ ...base, status: "PENDING", rejectionReasonCode: null })).toBeNull();
    expect(decisionLine({ ...base, status: "APPROVED", reviewedAt: null, rejectionReasonCode: null })).toBeNull();
  });

  it("says who approved", () => {
    expect(decisionLine({ ...base, status: "APPROVED", rejectionReasonCode: null })).toEqual({
      title: "Aprovado por Ana Souza em 09/11 · 15:30",
      reason: null,
    });
  });

  it("says who rejected and why", () => {
    expect(decisionLine({ ...base, status: "REJECTED", rejectionReasonCode: "ILLEGIBLE" })).toEqual({
      title: "Reprovado por Ana Souza em 09/11 · 15:30",
      reason: "Ilegível",
    });
    expect(
      decisionLine({ ...base, status: "REJECTED", rejectionReasonCode: "EXPIRED", rejectionReason: "Venceu" })?.reason,
    ).toBe("Vencido · Venceu");
    expect(
      decisionLine({ ...base, status: "REJECTED", rejectionReasonCode: "OTHER", rejectionReason: "Foto de outro" })
        ?.reason,
    ).toBe("Foto de outro");
    expect(decisionLine({ ...base, status: "REJECTED", rejectionReasonCode: "OTHER" })?.reason).toBe("Outro motivo");
    expect(
      decisionLine({ ...base, reviewedBy: null, status: "REJECTED", rejectionReasonCode: null }),
    ).toEqual({ title: "Reprovado por Um admin em 09/11 · 15:30", reason: null });
  });
});

describe("rejecting", () => {
  it("offers every reason the API accepts", () => {
    expect(DOCUMENT_REJECTION_REASONS).toEqual([
      "ILLEGIBLE",
      "EXPIRED",
      "DATA_MISMATCH",
      "WRONG_TYPE",
      "INCOMPLETE",
      "OTHER",
    ]);
  });

  it("names the document with its driver or its van", () => {
    const page = detail();
    expect(submissionInSentence(page, findSubmission(page, "DRIVER_DOCUMENT", "doc1")!)).toBe(
      "a certidão criminal de Fábio Teixeira",
    );
    expect(submissionInSentence(page, findSubmission(page, "VEHICLE_DOCUMENT", "vst1")!)).toBe(
      "a vistoria semestral da van ABC-1D23",
    );
  });

  it("says the approved renewal keeps counting", () => {
    const renewal = documentSubmission({ token: "c2" });
    const page = detail({
      driver: driver({ approvalStatus: "APPROVED" }),
      driverRequirements: [
        requirement("SCHOOL_DRIVER_COURSE", {
          state: "APPROVED",
          satisfied: true,
          current: documentSubmission({ token: "c1", status: "APPROVED" }),
          pending: renewal,
        }),
      ],
    });
    expect(rejectionConsequence(page, findSubmission(page, "DRIVER_DOCUMENT", "c2")!)).toBe(
      "O documento aprovado antes continua valendo até um novo ser aprovado.",
    );
    expect(rejectionConsequence(page, findSubmission(page, "DRIVER_DOCUMENT", "c1")!)).toBeNull();
  });

  it("says the registration stays under review", () => {
    const page = detail();
    expect(rejectionConsequence(page, findSubmission(page, "DRIVER_DOCUMENT", "doc1")!)).toBe(
      "O cadastro continua em análise.",
    );
  });
});

describe("the end of the review", () => {
  it("offers to approve when the API allows", () => {
    expect(
      doneScenario(
        detail({ decision: { canApprove: true, nextAction: "READY_TO_APPROVE", pendingReviewCount: 0, blockers: [] } }),
      ),
    ).toBe("ready");
  });

  it("hands over to the driver when something is still missing", () => {
    expect(doneScenario(detail())).toBe("blocked");
  });

  it("has nothing left for a registration not under review", () => {
    expect(doneScenario(detail({ driver: driver({ approvalStatus: "APPROVED" }) }))).toBe("clear");
  });

  it("picks the next driver with something pending", () => {
    const row = (token: string, pendingReviewCount: number) =>
      ({ token, pendingReviewCount }) as Parameters<typeof nextDriverInQueue>[0][number];
    expect(nextDriverInQueue([row("d1", 2), row("d2", 0), row("d3", 1)], "d1")?.token).toBe("d3");
    expect(nextDriverInQueue([row("d1", 2)], "d1")).toBeNull();
  });
});
