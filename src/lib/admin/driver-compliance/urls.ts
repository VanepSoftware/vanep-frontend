import type { SubmissionKind } from "./types";

const RESOURCE: Record<SubmissionKind, string> = {
  DRIVER_DOCUMENT: "driver-documents",
  VEHICLE_DOCUMENT: "vehicle-documents",
  DRIVER_CNH: "driver-cnhs",
};

/** Rota do proxy que decide um envio (`PUT`). */
export function submissionStatusUrl(kind: SubmissionKind, token: string): string {
  return `/api/admin/${RESOURCE[kind]}/${encodeURIComponent(token)}/status`;
}

/**
 * O `fileUrl` vem relativo à API (`/api/driver-documents/{token}/file?v=…`).
 * O navegador abre o arquivo pelo proxy do admin, na mesma rota sob `/api/admin`,
 * mantendo o `v` para o cache imutável. Qualquer outro caminho dá `null`.
 */
const FILE_URL = /^\/api\/((?:driver-documents|vehicle-documents|driver-cnhs)\/[\w-]+\/file)(\?v=[\w-]+)?$/;

export function adminFileUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null;
  const match = FILE_URL.exec(fileUrl);
  if (!match) return null;
  return `/api/admin/${match[1]}${match[2] ?? ""}`;
}
