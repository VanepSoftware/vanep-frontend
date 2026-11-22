import { describe, expect, it } from "vitest";

import {
  dateInSaoPaulo,
  daysBetween,
  expiryDistance,
  formatDate,
  formatDateTime,
  formatInstantDate,
  formatShortDateTime,
  relativeDaysAgo,
  todayInSaoPaulo,
} from "@/lib/admin/driver-compliance/format";
import {
  dateCell,
  documentsChip,
  initials,
  parsePageIndex,
  parseQueuePage,
  parseView,
  queueFooter,
  splitDriverTurn,
  viewCount,
} from "@/lib/admin/driver-compliance/queue";
import {
  approvalStatusTone,
  complianceStateTone,
  documentStatusTone,
} from "@/lib/admin/driver-compliance/tone";
import type { DriverComplianceCounts, DriverComplianceRow } from "@/lib/admin/driver-compliance/types";
import { interpolate, plural } from "@/lib/l10n";

const TODAY = "2026-11-14";

function row(overrides: Partial<DriverComplianceRow> = {}): DriverComplianceRow {
  return {
    token: "d1",
    name: "Marina Costa",
    email: "marina@email.com",
    city: "Taguatinga",
    vehicleCount: 1,
    approvalStatus: "UNDER_REVIEW",
    submittedAt: "2026-11-11T13:05:00Z",
    createdAt: "2026-11-02T12:00:00Z",
    nextAction: "ADMIN",
    canApprove: false,
    pendingReviewCount: 0,
    oldestPendingAt: null,
    rejectedCount: 0,
    missingCount: 0,
    expiredCount: 0,
    nextExpiryOn: null,
    ...overrides,
  };
}

const COUNTS: DriverComplianceCounts = {
  asOf: TODAY,
  awaitingDecision: 4,
  awaitingDriver: 1,
  pendingDocuments: 6,
  expiring: 3,
  all: 128,
  badge: 6,
};

describe("l10n helpers", () => {
  it("fills named values and keeps unknown ones", () => {
    expect(interpolate("{a} e {b}", { a: 1 })).toBe("1 e {b}");
  });

  it("uses the singular only for one", () => {
    const message = { one: "1 item", other: "{count} itens" };
    expect(plural(message, 1)).toBe("1 item");
    expect(plural(message, 0)).toBe("0 itens");
    expect(plural(message, 3)).toBe("3 itens");
  });
});

describe("format", () => {
  it("formats a service date without shifting the day", () => {
    expect(formatDate("2027-02-14")).toBe("14/02/2027");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("shows instants in São Paulo", () => {
    // 01:00Z ainda é o dia anterior em São Paulo
    expect(dateInSaoPaulo("2026-11-13T01:00:00Z")).toBe("2026-11-12");
    expect(formatInstantDate("2026-11-13T01:00:00Z")).toBe("12/11/2026");
    expect(formatDateTime("2026-11-11T12:12:00Z")).toBe("11/11/2026 às 09:12");
    expect(formatShortDateTime("2026-11-11T12:12:00Z")).toBe("11/11 · 09:12");
    expect(todayInSaoPaulo(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
  });

  it("counts calendar days", () => {
    expect(daysBetween("2026-11-14", "2026-12-14")).toBe(30);
    expect(daysBetween("2026-11-14", "2026-11-09")).toBe(-5);
    expect(() => daysBetween("x", "2026-11-14")).toThrow(RangeError);
  });

  it("says how long ago, by São Paulo days", () => {
    expect(relativeDaysAgo("2026-11-14T10:00:00Z", TODAY)).toBe("hoje");
    expect(relativeDaysAgo("2026-11-14T03:30:00Z", TODAY)).toBe("hoje");
    expect(relativeDaysAgo("2026-11-14T02:30:00Z", TODAY)).toBe("ontem");
    expect(relativeDaysAgo("2026-11-13T12:00:00Z", TODAY)).toBe("ontem");
    expect(relativeDaysAgo("2026-11-10T12:00:00Z", TODAY)).toBe("há 4 dias");
  });

  it("says how far the expiry is", () => {
    expect(expiryDistance("2026-11-14", TODAY)).toBe("vence hoje");
    expect(expiryDistance("2026-11-15", TODAY)).toBe("vence amanhã");
    expect(expiryDistance("2026-11-26", TODAY)).toBe("vence em 12 dias");
    expect(expiryDistance("2026-11-13", TODAY)).toBe("venceu ontem");
    expect(expiryDistance("2026-11-09", TODAY)).toBe("venceu há 5 dias");
  });
});

describe("tones", () => {
  it("maps every status to a tone", () => {
    expect(approvalStatusTone("UNDER_REVIEW")).toBe("brand");
    expect(approvalStatusTone("APPROVED")).toBe("success");
    expect(approvalStatusTone("REJECTED")).toBe("danger");
    expect(approvalStatusTone("PENDING")).toBe("neutral");
    expect(complianceStateTone("APPROVED")).toBe("success");
    expect(complianceStateTone("PENDING")).toBe("warning");
    expect(complianceStateTone("REJECTED")).toBe("danger");
    expect(complianceStateTone("EXPIRED")).toBe("dangerSolid");
    expect(complianceStateTone("MISSING")).toBe("outline");
    expect(documentStatusTone("APPROVED")).toBe("success");
    expect(documentStatusTone("PENDING")).toBe("warning");
    expect(documentStatusTone("REJECTED")).toBe("danger");
  });
});

describe("queue params", () => {
  it("falls back to the default view", () => {
    expect(parseView("EXPIRING")).toBe("EXPIRING");
    expect(parseView("expiring")).toBe("AWAITING_DECISION");
    expect(parseView(null)).toBe("AWAITING_DECISION");
  });

  it("accepts only non-negative whole pages", () => {
    expect(parsePageIndex("3")).toBe(3);
    expect(parsePageIndex("-1")).toBe(0);
    expect(parsePageIndex("1.5")).toBe(0);
    expect(parsePageIndex("abc")).toBe(0);
    expect(parsePageIndex(null)).toBe(0);
  });

  it("reads the Spring page in both serializations", () => {
    const content = [row()];
    expect(parseQueuePage({ content, number: 2, totalPages: 5, totalElements: 90 })).toEqual({
      content,
      page: 2,
      totalPages: 5,
      totalElements: 90,
    });
    expect(
      parseQueuePage({ content, page: { number: 1, totalPages: 2, totalElements: 30 } }),
    ).toEqual({ content, page: 1, totalPages: 2, totalElements: 30 });
    expect(parseQueuePage(null)).toEqual({ content: [], page: 0, totalPages: 0, totalElements: 0 });
  });
});

describe("viewCount", () => {
  it("counts only the admin's turn in awaiting decision", () => {
    expect(viewCount("AWAITING_DECISION", COUNTS)).toBe(3);
    expect(viewCount("PENDING_DOCUMENTS", COUNTS)).toBe(6);
    expect(viewCount("EXPIRING", COUNTS)).toBe(3);
    expect(viewCount("ALL", COUNTS)).toBe(128);
  });
});

describe("documentsChip", () => {
  it("puts an expired document above everything", () => {
    expect(documentsChip(row({ expiredCount: 2, pendingReviewCount: 3 }), TODAY)).toEqual({
      tone: "dangerSolid",
      label: "2 vencidos",
    });
  });

  it("then the pending reviews", () => {
    expect(documentsChip(row({ pendingReviewCount: 1, rejectedCount: 1 }), TODAY)).toEqual({
      tone: "warning",
      label: "1 pendente",
    });
  });

  it("then an expiry within 30 days", () => {
    expect(documentsChip(row({ nextExpiryOn: "2026-11-26" }), TODAY).label).toBe("Vence em 12 dias");
    expect(documentsChip(row({ nextExpiryOn: "2026-11-15" }), TODAY).label).toBe("Vence amanhã");
    expect(documentsChip(row({ nextExpiryOn: TODAY }), TODAY).label).toBe("Vence hoje");
  });

  it("ignores an expiry beyond 30 days", () => {
    expect(documentsChip(row({ nextExpiryOn: "2026-12-15" }), TODAY).label).toBe("Em dia");
  });

  it("then rejected and missing documents", () => {
    expect(documentsChip(row({ rejectedCount: 1, missingCount: 2 }), TODAY)).toEqual({
      tone: "danger",
      label: "1 reprovado",
    });
    expect(documentsChip(row({ missingCount: 2 }), TODAY)).toEqual({
      tone: "outline",
      label: "2 faltando",
    });
  });

  it("tells a driver ready to approve from one up to date", () => {
    expect(documentsChip(row({ nextAction: "READY_TO_APPROVE" }), TODAY).label).toBe("Tudo aprovado");
    expect(documentsChip(row({ nextAction: "NONE", approvalStatus: "APPROVED" }), TODAY).label).toBe(
      "Em dia",
    );
  });
});

describe("dateCell", () => {
  it("shows when the registration was sent", () => {
    expect(dateCell("AWAITING_DECISION", row(), TODAY)).toEqual({
      primary: "há 3 dias",
      secondary: "11/11 · 10:05",
    });
    expect(dateCell("AWAITING_DECISION", row({ submittedAt: null }), TODAY)).toEqual({
      primary: "—",
      secondary: null,
    });
  });

  it("shows the oldest pending submission", () => {
    expect(
      dateCell("PENDING_DOCUMENTS", row({ oldestPendingAt: "2026-11-13T12:00:00Z" }), TODAY),
    ).toEqual({ primary: "ontem", secondary: "13/11 · 09:00" });
    expect(dateCell("PENDING_DOCUMENTS", row(), TODAY).primary).toBe("—");
  });

  it("shows the nearest expiry", () => {
    expect(dateCell("EXPIRING", row({ nextExpiryOn: "2026-11-09" }), TODAY)).toEqual({
      primary: "09/11/2026",
      secondary: "venceu há 5 dias",
    });
    expect(dateCell("EXPIRING", row(), TODAY).primary).toBe("—");
  });

  it("shows the sign-up date in all", () => {
    expect(dateCell("ALL", row(), TODAY)).toEqual({
      primary: "02/11/2026",
      secondary: "há 12 dias",
    });
  });
});

describe("splitDriverTurn", () => {
  const mine = row({ token: "a", nextAction: "ADMIN" });
  const ready = row({ token: "b", nextAction: "READY_TO_APPROVE" });
  const theirs = row({ token: "c", nextAction: "DRIVER" });

  it("moves the driver's turn to its own section in awaiting decision", () => {
    expect(splitDriverTurn("AWAITING_DECISION", [mine, ready, theirs])).toEqual({
      adminTurn: [mine, ready],
      driverTurn: [theirs],
    });
  });

  it("keeps the list as is in the other views", () => {
    expect(splitDriverTurn("ALL", [mine, theirs])).toEqual({ adminTurn: [mine, theirs], driverTurn: [] });
  });
});

describe("queueFooter", () => {
  it("splits awaiting decision between the admin and the driver", () => {
    expect(queueFooter("AWAITING_DECISION", "", 4, COUNTS)).toBe(
      "3 esperando você · 1 aguardando o motorista",
    );
    expect(queueFooter("AWAITING_DECISION", "", 4, null)).toBe("");
  });

  it("uses the view's total", () => {
    expect(queueFooter("PENDING_DOCUMENTS", "", 1, COUNTS)).toBe(
      "1 motorista com documento para revisar",
    );
    expect(queueFooter("ALL", "", 128, COUNTS)).toBe("128 motoristas cadastrados");
  });

  it("uses the search total when searching", () => {
    expect(queueFooter("ALL", "abc", 2, COUNTS)).toBe("2 resultados para “abc”");
  });
});

describe("initials", () => {
  it("takes the first and last names", () => {
    expect(initials("Fábio Teixeira de Souza")).toBe("FS");
    expect(initials("  ana ")).toBe("A");
    expect(initials(null)).toBe("?");
  });
});
