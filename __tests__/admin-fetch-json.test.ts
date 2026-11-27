// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiProblemError, fetchJson, isAbortError } from "@/lib/admin/fetch-json";
import { useJsonResource } from "@/lib/admin/use-json-resource";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchJson", () => {
  it("returns the JSON and sends JSON headers with a body", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

    await expect(fetchJson("/api/x", { method: "PUT", body: "{}" })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "PUT",
      body: "{}",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
  });

  it("returns null for an empty answer", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(fetchJson("/api/x")).resolves.toBeNull();
    fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
    await expect(fetchJson("/api/x")).resolves.toBeNull();
  });

  it("throws the problem of an error answer", async () => {
    fetchMock.mockResolvedValueOnce(json(409, { code: "document.review.stale", detail: "Mudou." }));

    const error = await fetchJson("/api/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem).toMatchObject({
      status: 409,
      code: "document.review.stale",
    });
    expect((error as ApiProblemError).message).toBe("document.review.stale");
  });

  it("turns a network failure into a status 0 problem", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const error = await fetchJson("/api/x").catch((e: unknown) => e);
    expect((error as ApiProblemError).problem.status).toBe(0);
    expect((error as ApiProblemError).message).toBe("HTTP 0");
  });

  it("lets an abort through", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    const error = await fetchJson("/api/x").catch((e: unknown) => e);
    expect(isAbortError(error)).toBe(true);
    expect(isAbortError(new Error("x"))).toBe(false);
  });
});

describe("useJsonResource", () => {
  it("loads, then exposes the data", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { n: 1 }));
    const { result } = renderHook(() => useJsonResource<{ n: number }>("/api/a"));

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current.state).toEqual({ status: "ready", data: { n: 1 } }));
    expect(result.current.latest).toEqual({ n: 1 });
  });

  it("keeps the last data of the same URL while reloading", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { n: 1 }));
    const { result } = renderHook(() => useJsonResource<{ n: number }>("/api/a"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    let resolve: (response: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    act(() => result.current.reload());

    expect(result.current.state).toEqual({ status: "loading" });
    expect(result.current.latest).toEqual({ n: 1 });

    await act(async () => resolve(json(200, { n: 2 })));
    expect(result.current.state).toEqual({ status: "ready", data: { n: 2 } });
  });

  it("never shows the data of another URL", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { n: 1 }));
    const { result, rerender } = renderHook(({ url }) => useJsonResource<{ n: number }>(url), {
      initialProps: { url: "/api/a" },
    });
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    fetchMock.mockReturnValueOnce(new Promise<Response>(() => {}));
    rerender({ url: "/api/b" });

    expect(result.current.state).toEqual({ status: "loading" });
    expect(result.current.latest).toBeNull();
  });

  it("exposes the error", async () => {
    fetchMock.mockResolvedValueOnce(json(403, {}));
    const { result } = renderHook(() => useJsonResource("/api/a"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
  });

  it("waits while there is no URL", () => {
    const { result } = renderHook(() => useJsonResource(null));
    expect(result.current.state).toEqual({ status: "loading" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
