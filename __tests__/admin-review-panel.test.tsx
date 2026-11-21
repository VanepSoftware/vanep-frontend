// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewPanel } from "@/app/(routes)/admin/drivers/[token]/review/_components/review-panel";
import { findSubmission } from "@/lib/admin/driver-compliance/review";

import { cnhSubmission, detail, requirement } from "./fixtures/driver-compliance";

const pendingCnh = cnhSubmission({
  status: "PENDING",
  reviewMethod: null,
  reviewedBy: null,
  reviewedAt: null,
  registrationNumber: null,
  category: null,
  issueDate: null,
  expiresAt: null,
  firstLicenseDate: null,
  issuingState: null,
  version: 2,
});

function page(submission = pendingCnh) {
  return detail({
    driverRequirements: [
      requirement("DRIVER_LICENSE", { state: submission.status === "APPROVED" ? "APPROVED" : "PENDING", current: submission }),
    ],
    vehicles: [],
    reviewQueue:
      submission.status === "PENDING"
        ? [{ kind: "DRIVER_CNH", token: submission.token, requirement: "DRIVER_LICENSE", vehicleToken: null }]
        : [],
  });
}

function renderPanel(submission = pendingCnh) {
  const data = page(submission);
  const found = findSubmission(data, "DRIVER_CNH", submission.token)!;
  const onOutcome = vi.fn();
  render(<ReviewPanel detail={data} found={found} onOutcome={onOutcome} />);
  return { onOutcome };
}

function respond(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const field = (label: string) => screen.getByLabelText(label, { exact: false });

function fillCnh() {
  fireEvent.change(field("Nº de registro"), { target: { value: "012.345.667-89" } });
  fireEvent.change(field("Categoria"), { target: { value: "D" } });
  fireEvent.change(field("Emissão"), { target: { value: "2024-03-10" } });
  fireEvent.change(field("Validade"), { target: { value: "2029-03-10" } });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  // O happy-dom não abre o `<dialog>` modal; a tela só precisa do atributo.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ReviewPanel on a pending CNH", () => {
  it("marks what is missing before asking to approve", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(screen.getByRole("alert").textContent).toBe("Confira os campos marcados.");
    expect(field("Nº de registro").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(field("Nº de registro"));
    expect(field("UF emissora").getAttribute("aria-invalid")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("approves with the data read from the file, after the confirmation", async () => {
    fetchMock.mockResolvedValue(respond(200, {}));
    const { onOutcome } = renderPanel();
    fillCnh();
    expect(screen.getByText(/vence em/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Aprovar" }));

    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith({ kind: "decided" }));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/driver-cnhs/cnh1/status");
    expect(JSON.parse(init.body)).toEqual({
      status: "APPROVED",
      version: 2,
      registrationNumber: "01234566789",
      category: "D",
      issueDate: "2024-03-10",
      validUntil: "2029-03-10",
    });
  });

  it("marks the field the API refused", async () => {
    fetchMock.mockResolvedValue(respond(409, { code: "driver_cnh.registration.duplicate", detail: "Duplicado." }));
    const { onOutcome } = renderPanel();
    fillCnh();
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Aprovar" }));

    await waitFor(() => expect(screen.getByText("Este número de CNH já é de outro motorista.")).toBeTruthy());
    expect(field("Nº de registro").getAttribute("aria-invalid")).toBe("true");
    expect(onOutcome).not.toHaveBeenCalled();

    // Mudar o campo tira a marca da API.
    fireEvent.change(field("Nº de registro"), { target: { value: "98765432100" } });
    expect(screen.queryByText("Este número de CNH já é de outro motorista.")).toBeNull();
  });

  it("reloads when someone else decided first", async () => {
    fetchMock.mockResolvedValue(respond(409, { code: "document.review.stale" }));
    const { onOutcome } = renderPanel();
    fillCnh();
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Aprovar" }));

    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith(expect.objectContaining({ kind: "stale" })));
  });

  it("turns an expired document into a rejection as expired", () => {
    renderPanel();
    fillCnh();
    fireEvent.change(field("Validade"), { target: { value: "2026-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(screen.getByText("Documento vencido não pode ser aprovado.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reprovar como vencido" }));
    expect((screen.getByLabelText("Documento vencido") as HTMLInputElement).checked).toBe(true);
  });

  it("offers to reject a CNH of another category", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "É de outra categoria? Reprovar" }));
    const option = screen.getByLabelText(/Não serve para transporte escolar/) as HTMLInputElement;
    expect(option.checked).toBe(true);
  });
});

describe("ReviewPanel on an approved CNH", () => {
  it("shows the data and corrects it without losing the optional fields", async () => {
    fetchMock.mockResolvedValue(respond(200, {}));
    const { onOutcome } = renderPanel(cnhSubmission());
    expect(screen.getByText("01234566789")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Corrigir dados" }));
    expect((field("Nº de registro") as HTMLInputElement).value).toBe("01234566789");
    expect((field("UF emissora") as HTMLSelectElement).value).toBe("DF");
    // Na correção, a validade pode ser anterior a hoje.
    fireEvent.change(field("Validade"), { target: { value: "2026-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar correção" }));

    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith({ kind: "corrected" }));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/driver-cnhs/cnh1/data");
    expect(JSON.parse(init.body)).toEqual({
      version: 1,
      registrationNumber: "01234566789",
      category: "D",
      issueDate: "2024-03-10",
      validUntil: "2026-01-10",
      firstLicenseDate: "2015-06-02",
      issuingState: "DF",
    });
  });

  it("goes back to the data without saving on cancel", () => {
    renderPanel(cnhSubmission());
    fireEvent.click(screen.getByRole("button", { name: "Corrigir dados" }));
    fireEvent.change(field("Nº de registro"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("01234566789")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
