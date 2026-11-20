import { describe, expect, it } from "vitest";

import {
  driverRejectionText,
  formatCpf,
  formatPhone,
  formatPlate,
  historyLine,
  isAwaitingReview,
  maskCpf,
  maskPhone,
  renewalNote,
  requirementDetail,
  requirementExpiry,
  requirementsSummary,
  statusLine,
  vehicleDescription,
} from "@/lib/admin/driver-compliance/driver-page";

import {
  TODAY,
  cnhSubmission,
  detail,
  documentSubmission,
  driver,
  requirement,
  vehicle,
} from "./fixtures/driver-compliance";

describe("personal data", () => {
  it("formats and masks the CPF", () => {
    expect(formatCpf("12348212310")).toBe("123.482.123-10");
    expect(formatCpf("123.482.123-10")).toBe("123.482.123-10");
    expect(formatCpf("123")).toBe("123");
    expect(maskCpf("12348212310")).toBe("•••.482.•••-10");
    expect(maskCpf("123")).toBe("•••");
  });

  it("formats and masks the phone", () => {
    expect(formatPhone("61912344821")).toBe("(61) 91234-4821");
    expect(formatPhone("6131234821")).toBe("(61) 3123-4821");
    expect(formatPhone("+1 555")).toBe("+1 555");
    expect(maskPhone("61912344821")).toBe("(61) 9••••-4821");
    expect(maskPhone("6131234821")).toBe("(61) 3•••-4821");
    expect(maskPhone("123")).toBe("•••");
  });

  it("shows the plate with a hyphen", () => {
    expect(formatPlate("ABC1D23")).toBe("ABC-1D23");
    expect(formatPlate("abc-1234")).toBe("ABC-1234");
    expect(formatPlate("XYZ")).toBe("XYZ");
  });
});

describe("statusLine", () => {
  it("says when it was sent for review", () => {
    expect(statusLine(driver(), TODAY)).toBe("Enviado para análise há 6 dias · 08/11/2026 às 14:32");
  });

  it("says who approved or rejected", () => {
    const decided = { reviewedAt: "2026-11-12T13:00:00Z", reviewedBy: { token: "u", name: "Ana" } };
    expect(statusLine(driver({ approvalStatus: "APPROVED", ...decided }), TODAY)).toBe(
      "Aprovado em 12/11/2026 às 10:00 por Ana",
    );
    expect(statusLine(driver({ approvalStatus: "REJECTED", ...decided, reviewedBy: null }), TODAY)).toBe(
      "Recusado em 12/11/2026 às 10:00 por Um admin",
    );
  });

  it("falls back to the submission or to not sent", () => {
    expect(statusLine(driver({ approvalStatus: "APPROVED" }), TODAY)).toContain("Enviado para análise");
    expect(statusLine(driver({ approvalStatus: "REJECTED" }), TODAY)).toContain("Enviado para análise");
    expect(statusLine(driver({ approvalStatus: "PENDING", submittedAt: null }), TODAY)).toBe(
      "Cadastro ainda não enviado para análise",
    );
  });
});

describe("driverRejectionText", () => {
  it("shows the reason of a rejected registration", () => {
    expect(
      driverRejectionText(driver({ approvalStatus: "REJECTED", rejectionReasonCode: "DUPLICATE_ACCOUNT" })),
    ).toBe("Motivo: Conta duplicada");
    expect(
      driverRejectionText(
        driver({ approvalStatus: "REJECTED", rejectionReasonCode: "NOT_ELIGIBLE", rejectionReason: "Idade" }),
      ),
    ).toBe("Motivo: Não atende aos requisitos do CTB · Idade");
    expect(
      driverRejectionText(
        driver({ approvalStatus: "REJECTED", rejectionReasonCode: "OTHER", rejectionReason: "Fraude" }),
      ),
    ).toBe("Motivo: Fraude");
  });

  it("is empty for a registration that is not rejected", () => {
    expect(driverRejectionText(driver())).toBeNull();
    expect(driverRejectionText(driver({ approvalStatus: "REJECTED" }))).toBeNull();
  });
});

describe("requirementsSummary", () => {
  it("counts the required items by state, with renewals under review as pending", () => {
    const base = detail();
    const renewal = requirement("SCHOOL_DRIVER_COURSE", {
      state: "APPROVED",
      pending: documentSubmission({ token: "c2" }),
    });
    const withRenewal = detail({
      driverRequirements: [...base.driverRequirements, renewal],
      reviewQueue: [
        ...base.reviewQueue,
        { kind: "DRIVER_DOCUMENT", token: "c2", requirement: "SCHOOL_DRIVER_COURSE", vehicleToken: null },
      ],
    });
    // Motorista: CNH e curso aprovados, certidão pendente (o alvará é opcional).
    // Van: CRLV aprovado, vistoria pendente, autorização faltando.
    expect(requirementsSummary(base)).toBe("3 aprovados · 2 pendentes · 1 faltando");
    expect(requirementsSummary(withRenewal)).toBe("4 aprovados · 3 pendentes · 1 faltando");
  });

  it("leaves out a renewal still waiting for its file", () => {
    const base = detail();
    const renewal = requirement("SCHOOL_DRIVER_COURSE", {
      state: "APPROVED",
      pending: documentSubmission({ token: "c2", fileUrl: null, file: null }),
    });
    const withRenewal = detail({ driverRequirements: [...base.driverRequirements, renewal] });
    expect(requirementsSummary(withRenewal)).toBe("4 aprovados · 2 pendentes · 1 faltando");
  });

  it("is empty without requirements", () => {
    expect(requirementsSummary(detail({ driverRequirements: [], vehicles: [] }))).toBe("");
  });
});

describe("vehicleDescription", () => {
  it("joins the model and the seats", () => {
    expect(vehicleDescription(vehicle())).toBe("Mercedes-Benz Sprinter 2019 · 16 lugares");
    expect(vehicleDescription(vehicle({ capacity: null }))).toBe("Mercedes-Benz Sprinter 2019");
    expect(vehicleDescription(vehicle({ brand: null, model: null, year: null, capacity: 1 }))).toBe("1 lugar");
    expect(vehicleDescription(vehicle({ brand: null, model: null, year: null, capacity: null }))).toBeNull();
  });
});

describe("requirement row", () => {
  it("describes what was sent", () => {
    expect(requirementDetail(requirement("DRIVER_LICENSE", { state: "APPROVED", current: cnhSubmission() }))).toBe(
      "Categoria D · nº •••••••6789",
    );
    expect(requirementDetail(requirement("CRIMINAL_RECORD", { state: "PENDING", current: documentSubmission() }))).toBe(
      "nº CERT-2026-004512",
    );
    expect(
      requirementDetail(
        requirement("CRIMINAL_RECORD", { state: "PENDING", current: documentSubmission({ documentNumber: null }) }),
      ),
    ).toBe("—");
  });

  it("says when a pending item still waits for its file", () => {
    expect(
      requirementDetail(
        requirement("CRIMINAL_RECORD", {
          state: "PENDING",
          current: documentSubmission({ fileUrl: null, file: null }),
        }),
      ),
    ).toBe("Aguardando o arquivo do motorista");
  });

  it("tells a renewal under review from one waiting for its file", () => {
    const current = documentSubmission({ token: "c1", status: "APPROVED" });
    const page = detail({
      reviewQueue: [{ kind: "DRIVER_DOCUMENT", token: "c2", requirement: "SCHOOL_DRIVER_COURSE", vehicleToken: null }],
    });
    const underReview = requirement("SCHOOL_DRIVER_COURSE", {
      state: "APPROVED",
      current,
      pending: documentSubmission({ token: "c2" }),
    });
    const waitingFile = requirement("SCHOOL_DRIVER_COURSE", {
      state: "APPROVED",
      current,
      pending: documentSubmission({ token: "c3", fileUrl: null, file: null }),
    });
    expect(renewalNote(page, underReview)).toBe("Renovação em análise");
    expect(renewalNote(page, waitingFile)).toBe("Renovação aguardando o arquivo do motorista");
    expect(renewalNote(page, requirement("SCHOOL_DRIVER_COURSE", { state: "APPROVED", current }))).toBeNull();
    expect(isAwaitingReview(page, null)).toBe(false);
  });

  it("explains a missing or rejected item", () => {
    expect(requirementDetail(requirement("CRIMINAL_RECORD"))).toBe("Não enviado");
    expect(requirementDetail(requirement("MUNICIPAL_AUTHORIZATION"))).toBe(
      "Exigido só em algumas cidades. Não trava a aprovação.",
    );
    expect(
      requirementDetail(
        requirement("CRIMINAL_RECORD", { state: "REJECTED", current: documentSubmission({ status: "REJECTED" }) }),
      ),
    ).toBe("Aguardando reenvio do motorista");
  });

  it("shows the expiry of what counts", () => {
    const approved = (expiresAt: string) =>
      requirement("CRIMINAL_RECORD", {
        state: "APPROVED",
        current: documentSubmission({ status: "APPROVED", expiresAt }),
      });
    expect(requirementExpiry(approved("2027-02-14"), TODAY)).toBe("Vence em 14/02/2027");
    expect(requirementExpiry(approved("2026-10-30"), TODAY)).toBe("Venceu em 30/10/2026");
    expect(
      requirementExpiry(requirement("DRIVER_LICENSE", { state: "APPROVED", current: cnhSubmission() }), TODAY),
    ).toBe("Válida até 10/03/2029");
    expect(requirementExpiry(requirement("CRIMINAL_RECORD"), TODAY)).toBeNull();
    expect(
      requirementExpiry(
        requirement("CRIMINAL_RECORD", { state: "REJECTED", current: documentSubmission({ status: "REJECTED" }) }),
        TODAY,
      ),
    ).toBeNull();
  });
});

describe("historyLine", () => {
  const at = "2026-11-10T19:40:00Z";

  it("tells who did what to which document", () => {
    expect(
      historyLine({
        at,
        kind: "SUBMISSION_REJECTED",
        requirement: "SCHOOL_VEHICLE_AUTHORIZATION",
        vehicleToken: "v1",
        plate: "ABC1D23",
        actor: { token: "u", name: "Rafael Moura" },
        rejectionReasonCode: "ILLEGIBLE",
      }),
    ).toEqual({
      title: "Rafael Moura reprovou a autorização escolar da van ABC-1D23",
      meta: "10/11 · 16:40 · Ilegível",
      tone: "danger",
    });
  });

  it("attributes sendings to the driver", () => {
    expect(
      historyLine({
        at,
        kind: "SUBMISSION_SENT",
        requirement: "CRIMINAL_RECORD",
        vehicleToken: null,
        plate: null,
        actor: null,
        rejectionReasonCode: null,
      }),
    ).toEqual({ title: "Motorista enviou a certidão criminal", meta: "10/11 · 16:40", tone: "neutral" });
  });

  it("describes the registration's events", () => {
    const event = { at, requirement: null, vehicleToken: null, plate: null, rejectionReasonCode: null };
    expect(historyLine({ ...event, kind: "ONBOARDING_SUBMITTED", actor: null }).tone).toBe("brand");
    expect(
      historyLine({ ...event, kind: "DRIVER_APPROVED", actor: { token: "u", name: "Ana" } }),
    ).toMatchObject({ title: "Ana aprovou o cadastro", tone: "success" });
    expect(
      historyLine({ ...event, kind: "DRIVER_REJECTED", actor: null, rejectionReasonCode: "DUPLICATE_ACCOUNT" }),
    ).toMatchObject({ title: "Um admin recusou o cadastro", meta: "10/11 · 16:40 · Conta duplicada" });
    expect(
      historyLine({ ...event, kind: "SUBMISSION_APPROVED", actor: null, requirement: "DRIVER_LICENSE" }),
    ).toMatchObject({ title: "Um admin aprovou a CNH", tone: "success" });
  });

  it("ignores a reason code that does not belong to the event", () => {
    const event = { at, requirement: null, vehicleToken: null, plate: null, actor: null };
    expect(historyLine({ ...event, kind: "DRIVER_REJECTED", rejectionReasonCode: "ILLEGIBLE" }).meta).toBe(
      "10/11 · 16:40",
    );
    expect(
      historyLine({ ...event, kind: "SUBMISSION_REJECTED", rejectionReasonCode: "NOT_ELIGIBLE" }).meta,
    ).toBe("10/11 · 16:40");
  });
});
