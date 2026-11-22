"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { DriverComplianceCounts } from "@/lib/admin/driver-compliance/types";
import { fetchJson, isAbortError } from "@/lib/admin/fetch-json";

/** Abaixo disso, `ensureFresh` não pede de novo: a API avalia a base toda a cada leitura (D16). */
const FRESH_FOR_MS = 15_000;

type CountsState = {
  /** `null` até carregar, sem permissão ou com erro. */
  counts: DriverComplianceCounts | null;
  /** Lê de novo agora. Para depois de uma decisão que muda a fila. */
  refresh: () => void;
  /** Lê de novo só se a última leitura é mais velha que alguns segundos. */
  ensureFresh: () => void;
};

const CountsContext = createContext<CountsState>({
  counts: null,
  refresh: () => {},
  ensureFresh: () => {},
});

/**
 * Uma leitura de `/compliance/counts` para o painel todo: o contador do menu e
 * as abas da fila usam a mesma. A fila pede `ensureFresh` ao abrir, as telas
 * que decidem pedem `refresh`, e a volta para a aba do navegador também atualiza.
 */
export function DriverReviewCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<DriverComplianceCounts | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const requestedAt = useRef(0);

  const refresh = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    requestedAt.current = Date.now();
    fetchJson<DriverComplianceCounts>("/api/admin/drivers/compliance/counts", {
      signal: controller.signal,
    })
      .then((data) => setCounts(data))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        // Sem permissão ou fora do ar, o painel segue sem números.
        setCounts(null);
      });
  }, []);

  const ensureFresh = useCallback(() => {
    if (Date.now() - requestedAt.current >= FRESH_FOR_MS) refresh();
  }, [refresh]);

  useEffect(() => {
    ensureFresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") ensureFresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      inFlight.current?.abort();
    };
  }, [ensureFresh]);

  const value = useMemo(() => ({ counts, refresh, ensureFresh }), [counts, refresh, ensureFresh]);
  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
}

export function useDriverReviewCounts(): CountsState {
  return useContext(CountsContext);
}
