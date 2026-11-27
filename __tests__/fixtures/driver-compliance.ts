import type {
  CnhSubmission,
  ComplianceDriver,
  ComplianceVehicle,
  DocumentSubmission,
  DriverComplianceDetail,
  RequirementStatus,
} from "@/lib/admin/driver-compliance/types";

export const TODAY = "2026-11-14";

/** Pendente: o motorista mandou só o arquivo, e os dados ficam para a aprovação (D2). */
export function documentSubmission(overrides: Partial<DocumentSubmission> = {}): DocumentSubmission {
  return {
    kind: "DRIVER_DOCUMENT",
    token: "doc1",
    documentNumber: null,
    expiresAt: null,
    status: "PENDING",
    reviewMethod: null,
    rejectionReasonCode: null,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "2026-11-11T12:12:00Z",
    version: 3,
    fileUrl: "/api/driver-documents/doc1/file?v=m1",
    file: { mimeType: "application/pdf", sizeBytes: 421_888, originalName: "certidao.pdf" },
    dataCorrectedAt: null,
    dataCorrectedBy: null,
    ...overrides,
  };
}

export function cnhSubmission(overrides: Partial<CnhSubmission> = {}): CnhSubmission {
  return {
    kind: "DRIVER_CNH",
    token: "cnh1",
    documentNumber: null,
    expiresAt: "2029-03-10",
    status: "APPROVED",
    reviewMethod: "MANUAL",
    rejectionReasonCode: null,
    rejectionReason: null,
    reviewedBy: { token: "u1", name: "Ana Souza" },
    reviewedAt: "2026-11-10T14:05:00Z",
    createdAt: "2026-11-08T17:32:00Z",
    version: 1,
    fileUrl: "/api/driver-cnhs/cnh1/file?v=m2",
    file: { mimeType: "image/jpeg", sizeBytes: 120_000, originalName: "cnh.jpg" },
    dataCorrectedAt: null,
    dataCorrectedBy: null,
    registrationNumber: "01234566789",
    category: "D",
    issueDate: "2024-03-10",
    firstLicenseDate: "2015-06-02",
    securityNumber: null,
    issuingState: "DF",
    ...overrides,
  };
}

export function requirement<R extends RequirementStatus["requirement"]>(
  requirementName: R,
  overrides: Partial<RequirementStatus<R>> = {},
): RequirementStatus<R> {
  return {
    requirement: requirementName,
    optional: requirementName === "MUNICIPAL_AUTHORIZATION",
    satisfied: false,
    state: "MISSING",
    current: null,
    pending: null,
    lastDecision: null,
    ...overrides,
  };
}

export function driver(overrides: Partial<ComplianceDriver> = {}): ComplianceDriver {
  return {
    token: "d1",
    name: "Fábio Teixeira",
    email: "fabio@email.com",
    phone: "61912344821",
    document: "12348212310",
    birthDate: "1984-03-17",
    city: "Brasília",
    experienceYears: 8,
    createdAt: "2026-11-02T12:00:00Z",
    approvalStatus: "UNDER_REVIEW",
    submittedAt: "2026-11-08T17:32:00Z",
    rejectionReasonCode: null,
    rejectionReason: null,
    reviewedAt: null,
    reviewedBy: null,
    ...overrides,
  };
}

export function vehicle(overrides: Partial<ComplianceVehicle> = {}): ComplianceVehicle {
  return {
    token: "v1",
    plate: "ABC1D23",
    brand: "Mercedes-Benz",
    model: "Sprinter",
    year: 2019,
    capacity: 16,
    qualified: false,
    requirements: [
      requirement("VEHICLE_REGISTRATION", {
        state: "APPROVED",
        satisfied: true,
        current: documentSubmission({
          kind: "VEHICLE_DOCUMENT",
          token: "crlv1",
          status: "APPROVED",
          documentNumber: "2026",
          expiresAt: "2026-12-31",
        }),
      }),
      requirement("VEHICLE_INSPECTION", {
        state: "PENDING",
        current: documentSubmission({ kind: "VEHICLE_DOCUMENT", token: "vst1" }),
      }),
      requirement("SCHOOL_VEHICLE_AUTHORIZATION"),
    ],
    ...overrides,
  };
}

export function detail(overrides: Partial<DriverComplianceDetail> = {}): DriverComplianceDetail {
  return {
    asOf: TODAY,
    driver: driver(),
    decision: { canApprove: false, nextAction: "ADMIN", pendingReviewCount: 2, blockers: [] },
    driverRequirements: [
      requirement("DRIVER_LICENSE", { state: "APPROVED", satisfied: true, current: cnhSubmission() }),
      requirement("SCHOOL_DRIVER_COURSE", {
        state: "APPROVED",
        satisfied: true,
        current: documentSubmission({
          token: "c1",
          status: "APPROVED",
          documentNumber: "CURSO-001",
          expiresAt: "2030-05-01",
        }),
      }),
      requirement("CRIMINAL_RECORD", { state: "PENDING", current: documentSubmission() }),
      requirement("MUNICIPAL_AUTHORIZATION"),
    ],
    vehicles: [vehicle()],
    reviewQueue: [
      { kind: "DRIVER_DOCUMENT", token: "doc1", requirement: "CRIMINAL_RECORD", vehicleToken: null },
      { kind: "VEHICLE_DOCUMENT", token: "vst1", requirement: "VEHICLE_INSPECTION", vehicleToken: "v1" },
    ],
    history: [],
    ...overrides,
  };
}
