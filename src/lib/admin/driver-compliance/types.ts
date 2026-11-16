/**
 * Contrato das rotas de revisão de motoristas da API (VAN-86, D15 a D20 do
 * `openspec/changes/vehicle-documents/design.md` do back). Os nomes seguem a
 * resposta da API um a um, para a tela nunca traduzir campo.
 */

/** Data sem hora (`2026-11-14`), no fuso de São Paulo. */
export type IsoDate = string;
/** Instante com fuso (`2026-11-14T13:05:00Z`). */
export type IsoDateTime = string;

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReviewMethod = "MANUAL" | "AUTO";

export type DriverApprovalStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type DocumentRejectionReason =
  | "ILLEGIBLE"
  | "EXPIRED"
  | "DATA_MISMATCH"
  | "WRONG_TYPE"
  | "INCOMPLETE"
  | "OTHER";

export type DriverRejectionReason = "DATA_MISMATCH" | "NOT_ELIGIBLE" | "DUPLICATE_ACCOUNT" | "OTHER";

export type DriverRequirement =
  | "DRIVER_LICENSE"
  | "SCHOOL_DRIVER_COURSE"
  | "CRIMINAL_RECORD"
  | "MUNICIPAL_AUTHORIZATION";

export type VehicleRequirement =
  | "VEHICLE_REGISTRATION"
  | "VEHICLE_INSPECTION"
  | "SCHOOL_VEHICLE_AUTHORIZATION";

export type CredentialRequirement = DriverRequirement | VehicleRequirement;

export type ComplianceState = "MISSING" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type NextAction = "READY_TO_APPROVE" | "ADMIN" | "DRIVER" | "NONE";

export type BlockerKind =
  | "APPROVAL_STATUS"
  | "NO_ACTIVE_VEHICLE"
  | "DRIVER_REQUIREMENT"
  | "VEHICLE_REQUIREMENT"
  | "CNH_CATEGORY";

export type DriverComplianceView = "AWAITING_DECISION" | "PENDING_DOCUMENTS" | "EXPIRING" | "ALL";

export type SubmissionKind = "DRIVER_DOCUMENT" | "VEHICLE_DOCUMENT" | "DRIVER_CNH";

export type HistoryKind =
  | "SUBMISSION_SENT"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  | "ONBOARDING_SUBMITTED"
  | "DRIVER_APPROVED"
  | "DRIVER_REJECTED";

export type UserRef = { token: string; name: string | null };

// ---------------------------------------------------------------- fila

/** Linha de `GET /api/drivers/compliance`. Sem CPF e sem telefone. */
export type DriverComplianceRow = {
  token: string;
  name: string | null;
  email: string | null;
  city: string | null;
  vehicleCount: number;
  approvalStatus: DriverApprovalStatus;
  submittedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  nextAction: NextAction;
  canApprove: boolean;
  pendingReviewCount: number;
  oldestPendingAt: IsoDateTime | null;
  rejectedCount: number;
  missingCount: number;
  expiredCount: number;
  nextExpiryOn: IsoDate | null;
};

/** `GET /api/drivers/compliance/counts`. "Esperando você" é `awaitingDecision - awaitingDriver`. */
export type DriverComplianceCounts = {
  asOf: IsoDate;
  awaitingDecision: number;
  awaitingDriver: number;
  pendingDocuments: number;
  expiring: number;
  all: number;
  badge: number;
};

// ---------------------------------------------------------------- página do motorista

export type SubmissionFile = {
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
};

type SubmissionBase = {
  token: string;
  documentNumber: string | null;
  expiresAt: IsoDate | null;
  status: DocumentStatus;
  reviewMethod: ReviewMethod | null;
  rejectionReasonCode: DocumentRejectionReason | null;
  rejectionReason: string | null;
  reviewedBy: UserRef | null;
  reviewedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  version: number;
  /** Relativa à API (`/api/…?v=<token da mídia>`). Use `adminFileUrl` para abrir pelo proxy. */
  fileUrl: string | null;
  file: SubmissionFile | null;
};

export type DocumentSubmission = SubmissionBase & {
  kind: "DRIVER_DOCUMENT" | "VEHICLE_DOCUMENT";
};

/** Na CNH, `expiresAt` é a `validUntil`. O arquivo pode ser imagem ou PDF, como nos documentos. */
export type CnhSubmission = SubmissionBase & {
  kind: "DRIVER_CNH";
  category: string;
  issueDate: IsoDate | null;
  registrationNumberMasked: string;
};

export type Submission = DocumentSubmission | CnhSubmission;

/** Decisão do envio substituído mais recente do requisito, sem arquivo. */
export type LastDecision = {
  status: DocumentStatus;
  rejectionReasonCode: DocumentRejectionReason | null;
  rejectionReason: string | null;
  reviewedBy: UserRef | null;
  reviewedAt: IsoDateTime | null;
  supersededAt: IsoDateTime;
};

export type RequirementStatus<R extends CredentialRequirement = CredentialRequirement> = {
  requirement: R;
  optional: boolean;
  satisfied: boolean;
  state: ComplianceState;
  /** O envio que conta: o que satisfaz ou, se nenhum satisfaz, o mais recente. */
  current: Submission | null;
  /** Renovação em revisão ao lado de uma aprovação que ainda vale. */
  pending: Submission | null;
  lastDecision: LastDecision | null;
};

export type Blocker = {
  kind: BlockerKind;
  requirement: CredentialRequirement | null;
  state: ComplianceState | null;
  vehicleToken: string | null;
  plate: string | null;
};

export type DriverDecision = {
  canApprove: boolean;
  nextAction: NextAction;
  pendingReviewCount: number;
  /** Só quando `canApprove` é falso. Sem van qualificada, traz só a van mais perto de completar. */
  blockers: Blocker[];
};

export type ComplianceDriver = {
  token: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  birthDate: IsoDate | null;
  city: string | null;
  experienceYears: number | null;
  createdAt: IsoDateTime;
  approvalStatus: DriverApprovalStatus;
  submittedAt: IsoDateTime | null;
  rejectionReasonCode: DriverRejectionReason | null;
  rejectionReason: string | null;
  reviewedAt: IsoDateTime | null;
  reviewedBy: UserRef | null;
};

export type ComplianceVehicle = {
  token: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  qualified: boolean;
  requirements: RequirementStatus<VehicleRequirement>[];
};

/** Ordem do "pendente 1 de N": requisitos do motorista, depois as vans por placa. */
export type ReviewQueueItem = {
  kind: SubmissionKind;
  token: string;
  requirement: CredentialRequirement;
  vehicleToken: string | null;
};

export type HistoryEvent = {
  at: IsoDateTime;
  kind: HistoryKind;
  requirement: CredentialRequirement | null;
  vehicleToken: string | null;
  plate: string | null;
  /** Quem decidiu. Nulo nos envios, que são do motorista. */
  actor: UserRef | null;
  rejectionReasonCode: DocumentRejectionReason | DriverRejectionReason | null;
};

/** `GET /api/drivers/{token}/compliance`. */
export type DriverComplianceDetail = {
  asOf: IsoDate;
  driver: ComplianceDriver;
  decision: DriverDecision;
  driverRequirements: RequirementStatus<DriverRequirement>[];
  vehicles: ComplianceVehicle[];
  reviewQueue: ReviewQueueItem[];
  /** Os últimos 50 eventos, do mais novo ao mais antigo. */
  history: HistoryEvent[];
};

// ---------------------------------------------------------------- escrita

/** Corpo do `PUT …/{token}/status`. `rejectionReason` só é obrigatório com `OTHER`. */
export type SubmissionStatusRequest =
  | { status: "APPROVED"; version: number }
  | {
      status: "REJECTED";
      version: number;
      rejectionReasonCode: DocumentRejectionReason;
      rejectionReason?: string;
    };

/** Corpo do `POST /api/drivers/{token}/reject`. `reason` só é obrigatório com `OTHER`. */
export type DriverRejectionRequest = {
  reasonCode: DriverRejectionReason;
  reason?: string;
};
