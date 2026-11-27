import type { ComplianceState, DocumentStatus, DriverApprovalStatus } from "./types";

/** Cor de um chip. As telas mapeiam o tom para as classes; a lógica nunca fala de CSS. */
export type ChipTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "warningOutline"
  | "danger"
  | "dangerSolid"
  | "outline";

export function approvalStatusTone(status: DriverApprovalStatus): ChipTone {
  switch (status) {
    case "UNDER_REVIEW":
      return "brand";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "PENDING":
      return "neutral";
  }
}

export function complianceStateTone(state: ComplianceState): ChipTone {
  switch (state) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
    case "EXPIRED":
      return "dangerSolid";
    case "MISSING":
      return "outline";
  }
}

export function documentStatusTone(status: DocumentStatus): ChipTone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
  }
}
