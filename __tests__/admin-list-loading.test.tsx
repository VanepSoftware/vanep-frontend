// @vitest-environment happy-dom
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Clients from "@/app/(routes)/admin/clients/page";
import Drivers from "@/app/(routes)/admin/drivers/page";
import Permissions from "@/app/(routes)/admin/permissions/page";
import Roles from "@/app/(routes)/admin/roles/page";
import { t } from "@/lib/l10n";
import { useAdminQuery } from "@/lib/admin/use-admin-query";

const messages = t("admin");
const cases = [
  { name: "clients", endpoint: "/api/admin/clients", Screen: Clients, messages: messages.clients },
  { name: "drivers", endpoint: "/api/admin/drivers", Screen: Drivers, messages: messages.drivers },
  { name: "permissions", endpoint: "/api/admin/role-permissions", Screen: Permissions, messages: messages.permissions },
  { name: "roles", endpoint: "/api/admin/roles", Screen: Roles, messages: messages.roles },
];
const json = (value: unknown) => new Response(JSON.stringify(value));
const page = (content: unknown[]) => ({ content, number: 0, totalPages: 1, totalElements: content.length });

describe("admin query concurrency", () => {
  it.each(["response", "error"])("keeps the new page loading after an obsolete manual reload %s", async (outcome) => {
    const pending: { resolve: (value: Response) => void; reject: (cause: Error) => void; signal: AbortSignal }[] = [];
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) =>
      new Promise<Response>((resolve, reject) => pending.push({ resolve, reject, signal: options.signal as AbortSignal })),
    ));
    const view = renderHook(({ page }) => useAdminQuery<{ name: string }>(`/api/admin/clients?page=${page}`, "Falha"), { initialProps: { page: 0 } });
    await act(async () => pending[0].resolve(json({ name: "Página inicial" })));
    expect(view.result.current.data?.name).toBe("Página inicial");
    act(() => view.result.current.reload());
    expect(view.result.current.loading).toBe(true);
    view.rerender({ page: 1 });
    expect(pending[1].signal.aborted).toBe(true);
    await act(async () => {
      if (outcome === "response") pending[1].resolve(json({ name: "Recarga obsoleta" }));
      else pending[1].reject(new Error("Falha obsoleta"));
    });
    expect(view.result.current.loading).toBe(true);
    expect(view.result.current.error).toBeNull();
    expect(view.result.current.data).toBeNull();
    await act(async () => pending[2].resolve(json({ name: "Página atual" })));
    expect(view.result.current.data?.name).toBe("Página atual");
    expect(view.result.current.loading).toBe(false);
  });

  it("discards an old page response even after the new page has completed", async () => {
    const pending: ((value: Response) => void)[] = [];
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => pending.push(resolve))));
    const view = renderHook(({ page }) => useAdminQuery<{ name: string }>(`/api/admin/clients?page=${page}`, "Falha"), { initialProps: { page: 0 } });
    view.rerender({ page: 1 });
    await act(async () => pending[1](json({ name: "Atual" })));
    await act(async () => pending[0](json({ name: "Antiga" })));
    expect(view.result.current.data?.name).toBe("Atual");
  });

  it("cancels consecutive manual reloads and only accepts the last response", async () => {
    const pending: { resolve: (value: Response) => void; signal: AbortSignal }[] = [];
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) =>
      new Promise<Response>((resolve) => pending.push({ resolve, signal: options.signal as AbortSignal })),
    ));
    const view = renderHook(() => useAdminQuery<{ name: string }>("/api/admin/clients", "Falha"));
    act(() => view.result.current.reload());
    act(() => view.result.current.reload());
    expect(pending[0].signal.aborted).toBe(true);
    expect(pending[1].signal.aborted).toBe(true);
    await act(async () => pending[2].resolve(json({ name: "Última" })));
    await act(async () => { pending[0].resolve(json({ name: "Inicial" })); pending[1].resolve(json({ name: "Intermediária" })); });
    expect(view.result.current.data?.name).toBe("Última");
    view.unmount();
    expect(pending[2].signal.aborted).toBe(true);
  });
});

describe.each([
  { Screen: Permissions, messages: messages.permissions, list: "/api/admin/role-permissions", catalog: "/api/admin/permissions" },
  { Screen: Roles, messages: messages.roles, list: "/api/admin/roles", catalog: "/api/admin/role-permissions" },
])("independent catalog errors", ({ Screen, messages, list, catalog }) => {
  it("keeps a catalog failure visible after paginating and retries both requests", async () => {
    let failCatalog = true;
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith(catalog)) return Promise.resolve(failCatalog ? new Response(null, { status: 503 }) : json(catalog.endsWith("/permissions") ? ["READ"] : page([record])));
      return Promise.resolve(json({ ...page([record]), totalPages: 2 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(record.name);
    await screen.findByText(messages.loadError);
    fireEvent.click(screen.getByRole("button", { name: messages.next }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url.startsWith(list) && url.includes("page=1"))).toBe(true));
    await screen.findByText(record.name);
    expect(screen.getByText(messages.loadError)).toBeTruthy();
    failCatalog = false;
    fireEvent.click(screen.getByRole("button", { name: messages.retry }));
    await waitFor(() => expect(screen.queryByText(messages.loadError)).toBeNull());
    await screen.findByText(record.name);
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith(catalog))).toHaveLength(2);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const record = {
  token: "example/token", name: "Registro exemplo", email: "exemplo@example.test", photo: null,
  rating: 4.5, active: true, available: true, city: "Fortaleza", experienceYears: 2,
  approvalStatus: "APPROVED", createdAt: "2026-11-15", description: "Descrição exemplo",
  permissions: ["READ"], rolePermission: { token: "bundle", name: "Conjunto exemplo" },
  address: { street: "Rua exemplo", number: "10", cityName: "Fortaleza", stateUf: "CE", zipCode: "60000000" },
};
const rows = [record, {
  ...record, token: "empty", name: null, email: null, photo: null, rating: null,
  active: false, available: false, city: null, experienceYears: null, approvalStatus: "REJECTED",
  createdAt: null, description: null, rolePermission: null, address: null,
}, { ...record, token: "invalid", name: "Outro registro", approvalStatus: "PENDING", createdAt: "invalid", address: {} }];

describe.each(cases)("$name request lifecycle", ({ Screen, messages, endpoint }) => {
  it.each(["response", "error"])("ignores a stale %s after an effect restarts", async (outcome) => {
    const counts = new Map<string, number>();
    const pending: { resolve: (value: Response) => void; reject: (cause: Error) => void; list: boolean }[] = [];
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn((url: string, options: RequestInit) => {
      signals.push(options.signal as AbortSignal);
      const count = counts.get(url) ?? 0;
      counts.set(url, count + 1);
      const list = url.includes("page=");
      if (count === 0) {
        return new Promise<Response>((resolve, reject) => pending.push({ resolve, reject, list }));
      }
      return Promise.resolve(json(list ? page([]) : []));
    }));

    const view = render(<StrictMode><Screen /></StrictMode>);
    await screen.findByText(messages.empty);
    expect(signals.some((signal) => signal.aborted)).toBe(true);

    await act(async () => {
      for (const request of pending) {
        if (outcome === "error") request.reject(new Error("late network failure"));
        else request.resolve(json(request.list ? page([{
          token: "old", name: "Resposta antiga", active: true,
          approvalStatus: "PENDING", permissions: [], createdAt: null,
        }]) : ["old-permission"]));
      }
    });
    expect(screen.queryByText("Resposta antiga")).toBeNull();
    expect(screen.queryByText(messages.loadError)).toBeNull();
    expect(screen.getByText(messages.empty)).toBeTruthy();
    view.unmount();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("retries a failed list, paginates in both directions and shows an empty page", async () => {
    let fail = true;
    const fetchMock = vi.fn((url: string) => {
      if (!url.startsWith(endpoint + "?")) return Promise.resolve(json([]));
      if (fail) return Promise.resolve(new Response(null, { status: 503 }));
      const second = url.includes("page=1");
      return Promise.resolve(json({ content: second ? [] : rows, page: { number: second ? 1 : 0, totalPages: 2, totalElements: 3 } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(messages.loadError);
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: messages.retry }));
    await screen.findByText(record.name);
    fireEvent.click(screen.getByRole("button", { name: messages.next }));
    await screen.findByText(messages.empty);
    fireEvent.click(screen.getByRole("button", { name: messages.previous }));
    await screen.findByText(record.name);
    expect(fetchMock.mock.calls.some(([url]) => url.includes("page=1"))).toBe(true);
  });

  it("clears an action error when paginating in either direction", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") return Promise.resolve(new Response(null, { status: 403 }));
      if (!url.startsWith(endpoint + "?")) return Promise.resolve(json([]));
      const number = url.includes("page=1") ? 1 : 0;
      return Promise.resolve(json({ ...page([record]), number, totalPages: 2 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(record.name);

    for (const direction of [messages.next, messages.previous]) {
      fireEvent.click(screen.getByRole("button", { name: messages.delete }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: messages.delete }));
      await screen.findByText(messages.deleteError);
      fireEvent.click(screen.getByRole("button", { name: direction }));
      expect(screen.queryByText(messages.deleteError)).toBeNull();
      await screen.findByText(record.name);
    }

    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith(endpoint + "?")).map(([url]) =>
      new URL(url, "https://example.test").searchParams.get("page"),
    )).toEqual(["0", "1", "0"]);
  });

  it.each(["success", "status", "network"])("handles deletion: %s", async (outcome) => {
    let deleted = false;
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        expect(url).toBe(endpoint + "/example%2Ftoken");
        if (outcome === "network") return Promise.reject(new Error("offline"));
        if (outcome === "status") return Promise.resolve(new Response(null, { status: 403 }));
        deleted = true;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(json(url.startsWith(endpoint + "?") ? page(deleted ? [] : [record]) : []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(record.name);
    fireEvent.click(screen.getByRole("button", { name: messages.delete }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("common").cancel }));
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: messages.delete }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: messages.delete }));
    await screen.findByText(outcome === "success" ? messages.empty : messages.deleteError);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe.each([
  { Screen: Permissions, messages: messages.permissions, endpoint: "/api/admin/role-permissions", kind: "permissions" },
  { Screen: Roles, messages: messages.roles, endpoint: "/api/admin/roles", kind: "roles" },
])("$kind editing", ({ Screen, messages, endpoint, kind }) => {
  it.each(["create", "edit", "delete"] as const)("refreshes only the list after %s", async (action) => {
    const catalog = kind === "permissions" ? "/api/admin/permissions" : "/api/admin/role-permissions?page=0&size=100";
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method) return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(json(url === "/api/admin/permissions" ? ["READ"] : page([record])));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(record.name);

    if (action === "delete") {
      fireEvent.click(screen.getByRole("button", { name: messages.delete }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: messages.delete }));
    } else {
      fireEvent.click(screen.getByRole("button", { name: action === "create" ? messages.new : messages.edit }));
      fireEvent.change(screen.getByLabelText(messages.nameLabel), { target: { value: "Nome atualizado" } });
      if (kind === "permissions" && action === "create") fireEvent.click(screen.getByLabelText("READ"));
      fireEvent.click(screen.getByRole("button", { name: messages.save }));
    }

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await screen.findByText(record.name);
    expect(fetchMock.mock.calls.filter(([url, options]) => url.startsWith(endpoint + "?") && !options?.method)).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => url === catalog)).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === ({ create: "POST", edit: "PUT", delete: "DELETE" })[action])).toBe(true);
  });

  it("validates, creates, edits and reports save failures", async () => {
    let outcome = "status";
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method) {
        if (outcome === "network") return Promise.reject(new Error("offline"));
        return Promise.resolve(new Response(null, { status: outcome === "success" ? 204 : outcome === "conflict" ? 409 : 500 }));
      }
      if (url === "/api/admin/permissions") return Promise.resolve(json(["READ", "WRITE"]));
      return Promise.resolve(json(page([record])));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    await screen.findByText(record.name);
    fireEvent.click(screen.getByRole("button", { name: messages.new }));
    fireEvent.click(screen.getByRole("button", { name: messages.save }));
    await screen.findByText(messages.nameRequired);
    fireEvent.change(screen.getByLabelText(messages.nameLabel), { target: { value: " Novo nome " } });
    if (kind === "permissions") {
      fireEvent.click(screen.getByRole("button", { name: messages.save }));
      await screen.findByText(t("admin").permissions.permissionsRequired);
      fireEvent.click(screen.getByLabelText("READ"));
      fireEvent.click(screen.getByLabelText("READ"));
      fireEvent.click(screen.getByRole("button", { name: t("admin").permissions.selectAll }));
      fireEvent.click(screen.getByRole("button", { name: t("admin").permissions.clearAll }));
      fireEvent.click(screen.getByLabelText("WRITE"));
    } else {
      fireEvent.change(screen.getByLabelText(t("admin").roles.descriptionLabel), { target: { value: "Descrição nova" } });
      fireEvent.change(screen.getByLabelText(t("admin").roles.bundleLabel), { target: { value: record.token } });
    }
    for (const failure of ["status", "network", ...(kind === "permissions" ? ["conflict"] : [])]) {
      outcome = failure;
      fireEvent.click(screen.getByRole("button", { name: messages.save }));
      await screen.findByText(failure === "conflict" ? t("admin").permissions.conflict : messages.saveError);
    }
    outcome = "success";
    fireEvent.click(screen.getByRole("button", { name: messages.save }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const create = fetchMock.mock.calls.find(([, options]) => options?.method === "POST")!;
    expect(create[0]).toBe(endpoint);
    expect(JSON.parse(create[1]!.body as string).name).toBe("Novo nome");
    await screen.findByText(record.name);
    fireEvent.click(screen.getByRole("button", { name: messages.edit }));
    fireEvent.click(screen.getByRole("button", { name: messages.save }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock.mock.calls.some(([url, options]) => url === endpoint + "/example%2Ftoken" && options?.method === "PUT")).toBe(true);
    await screen.findByText(record.name);
    fireEvent.click(screen.getByRole("button", { name: messages.new }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("common").cancel }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

it.each([true, false])("shows client details with optional fields: %s", async (complete) => {
  const client = complete ? { ...record, photo: "https://example.test/photo", address: { ...record.address, complement: "Casa", neighborhood: "Bairro" } } : { ...rows[1], address: { zipCode: "123" } };
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json(page([client])))));
  render(<Clients />);
  const m = messages.clients;
  fireEvent.click(await screen.findByRole("button", { name: m.view }));
  const dialog = screen.getByRole("dialog", { name: m.viewTitle });
  expect(within(dialog).getByText(client.name ?? m.noName)).toBeTruthy();
  if (complete) expect(within(dialog).getByText(/60000-000/)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: t("common").close }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("preserves client editing and reports validation and API failures", async () => {
  const m = messages.clients;
  let outcome: number | "network" = 500;
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === "PATCH") {
      expect(url).toBe("/api/admin/clients/example%2Ftoken");
      if (outcome === "network") return Promise.reject(new Error("offline"));
      return Promise.resolve(new Response(null, { status: outcome }));
    }
    return Promise.resolve(json(page([record])));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<Clients />);
  fireEvent.click(await screen.findByRole("button", { name: m.edit }));
  fireEvent.submit(screen.getByRole("button", { name: m.save }).closest("form")!);
  await screen.findByText(m.noChanges);
  fireEvent.change(screen.getByLabelText(m.ratingLabel), { target: { value: "6" } });
  fireEvent.submit(screen.getByRole("button", { name: m.save }).closest("form")!);
  await screen.findByText(m.invalidRating);
  fireEvent.change(screen.getByLabelText(m.ratingLabel), { target: { value: "4" } });
  fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: "Nome editado" } });
  fireEvent.change(screen.getByLabelText(m.emailLabel), { target: { value: "editado@example.test" } });
  fireEvent.click(screen.getByLabelText(m.activeLabel));
  for (const [status, message] of [[409, m.editConflict], [403, m.editForbidden], [404, m.editNotFound], [500, m.editError], ["network", m.editError]] as const) {
    outcome = status;
    fireEvent.submit(screen.getByRole("button", { name: m.save }).closest("form")!);
    await screen.findByText(message);
    await waitFor(() => expect((screen.getByRole("button", { name: m.save }) as HTMLButtonElement).disabled).toBe(false));
  }
  outcome = 204;
  fireEvent.submit(screen.getByRole("button", { name: m.save }).closest("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(JSON.parse(fetchMock.mock.calls.find(([, options]) => options?.method === "PATCH")![1]!.body as string)).toEqual({ name: "Nome editado", email: "editado@example.test", rating: 4, active: false });
  fireEvent.click(await screen.findByRole("button", { name: m.edit }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("common").cancel }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("preserves photo validation, upload errors and successful refresh", async () => {
  const m = messages.clients;
  let outcome: number | "network" = 500;
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === "POST") {
      expect(url).toBe("/api/admin/clients/example%2Ftoken/photo");
      expect((options.body as FormData).get("file")).toBeTruthy();
      if (outcome === "network") return Promise.reject(new Error("offline"));
      return Promise.resolve(new Response(null, { status: outcome }));
    }
    return Promise.resolve(json(page([record])));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<Clients />);
  fireEvent.click(await screen.findByRole("button", { name: m.edit }));
  const input = screen.getByLabelText(m.changePhoto);
  fireEvent.change(input, { target: { files: [] } });
  fireEvent.change(input, { target: { files: [new File(["text"], "test.txt", { type: "text/plain" })] } });
  await screen.findByText(m.photoInvalidType);
  fireEvent.change(input, { target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })] } });
  await screen.findByText(m.photoTooLarge);
  const file = new File(["example bytes"], "example.png", { type: "image/png" });
  for (const [status, message] of [[400, m.photoInvalidType], [413, m.photoTooLarge], [403, m.editForbidden], [404, m.editNotFound], [500, m.photoUploadError], ["network", m.photoUploadError]] as const) {
    outcome = status;
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByText(message);
    await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
  }
  outcome = 204;
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(7);
});
