"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchJson, isAbortError } from "@/lib/admin/fetch-json";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

type Settled<T> = { url: string; nonce: number; state: ResourceState<T> };

export type JsonResource<T> = {
  /** O estado da leitura atual: carregando enquanto a URL ou o `reload` não respondeu. */
  state: ResourceState<T>;
  /**
   * O último dado bom desta mesma URL, para a tela não piscar num `reload`
   * (depois de uma decisão). Nunca é o dado de outra URL.
   */
  latest: T | null;
  reload: () => void;
};

/**
 * Lê um JSON do admin. O carregamento é derivado da URL pedida, não de um
 * `setState` no efeito, e uma resposta atrasada de outra URL é descartada.
 */
export function useJsonResource<T>(url: string | null): JsonResource<T> {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [latest, setLatest] = useState<{ url: string; data: T } | null>(null);

  useEffect(() => {
    if (url == null) return;
    const controller = new AbortController();
    fetchJson<T>(url, { signal: controller.signal })
      .then((data) => {
        setSettled({ url, nonce, state: { status: "ready", data } });
        setLatest({ url, data });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setSettled({ url, nonce, state: { status: "error", error } });
      });
    return () => controller.abort();
  }, [url, nonce]);

  const reload = useCallback(() => setNonce((current) => current + 1), []);

  const current = settled && settled.url === url && settled.nonce === nonce;
  return {
    state: current ? settled.state : { status: "loading" },
    latest: latest && latest.url === url ? latest.data : null,
    reload,
  };
}
