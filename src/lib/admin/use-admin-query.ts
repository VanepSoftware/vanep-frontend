"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Snapshot<T> = {
  key: string;
  data: T | null;
  error: string | null;
};

async function requestJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.json() as Promise<T>;
}

export function useAdminQuery<T>(url: string, errorMessage: string) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const key = JSON.stringify([url, revision]);

  const reload = useCallback(() => {
    // Invalidate an in-flight response immediately, including repeated clicks.
    controllerRef.current?.abort();
    setRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    void requestJson<T>(url, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSnapshot({ key, data, error: null });
      },
      () => {
        if (!controller.signal.aborted) {
          setSnapshot({ key, data: null, error: errorMessage });
        }
      },
    );
    return () => controller.abort();
  }, [url, key, errorMessage]);

  const current = snapshot?.key === key ? snapshot : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  };
}
