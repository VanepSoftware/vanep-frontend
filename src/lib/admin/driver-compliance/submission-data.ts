import type { ApiProblem } from "@/lib/admin/api-problem";
import { isIsoDate } from "@/lib/date-input";
import { t } from "@/lib/l10n";

import type {
  CredentialRequirement,
  IsoDate,
  Submission,
  SubmissionData,
  SubmissionKind,
} from "./types";

const messages = t("admin").driverReview;
const data = messages.review.data;

/**
 * Os dados que o admin preenche olhando o arquivo (D2 e D14 da VAN-86). Os
 * nomes são os do corpo da API, para o `field` de um erro marcar o campo certo.
 */
export type DataField =
  | "documentNumber"
  | "expiresAt"
  | "registrationNumber"
  | "category"
  | "issueDate"
  | "validUntil"
  | "firstLicenseDate"
  | "securityNumber"
  | "issuingState";

export type DataValues = Partial<Record<DataField, string>>;

export type FieldSpec = {
  name: DataField;
  input: "text" | "digits" | "date" | "select";
  required: boolean;
  maxLength?: number;
  options?: readonly string[];
};

/** As categorias que servem para transporte escolar. Outra é reprovada com `NOT_ELIGIBLE`. */
export const CNH_CATEGORIES = ["D", "E", "AD", "AE"] as const;

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const DOCUMENT_NUMBER_MAX = 64;
const REGISTRATION_DIGITS = { min: 9, max: 11 } as const;

/** O que cada tipo exige na aprovação: `[número, validade]` (tabela do D2). */
const DOCUMENT_REQUIRED: Record<Exclude<CredentialRequirement, "DRIVER_LICENSE">, [boolean, boolean]> = {
  VEHICLE_REGISTRATION: [false, true],
  VEHICLE_INSPECTION: [false, true],
  SCHOOL_VEHICLE_AUTHORIZATION: [true, true],
  MUNICIPAL_AUTHORIZATION: [true, false],
  SCHOOL_DRIVER_COURSE: [false, false],
  CRIMINAL_RECORD: [false, false],
};

const CNH_FIELDS: readonly FieldSpec[] = [
  { name: "registrationNumber", input: "digits", required: true, maxLength: REGISTRATION_DIGITS.max },
  { name: "category", input: "select", required: true, options: CNH_CATEGORIES },
  { name: "issueDate", input: "date", required: true },
  { name: "validUntil", input: "date", required: true },
  { name: "firstLicenseDate", input: "date", required: false },
  { name: "issuingState", input: "select", required: false, options: BRAZILIAN_STATES },
  { name: "securityNumber", input: "digits", required: false },
];

/** Os campos do formulário, na ordem em que aparecem no documento. */
export function dataFields(kind: SubmissionKind, requirement: CredentialRequirement): readonly FieldSpec[] {
  if (kind === "DRIVER_CNH" || requirement === "DRIVER_LICENSE") return CNH_FIELDS;
  const [numberRequired, expiryRequired] = DOCUMENT_REQUIRED[requirement];
  return [
    { name: "documentNumber", input: "text", required: numberRequired, maxLength: DOCUMENT_NUMBER_MAX },
    { name: "expiresAt", input: "date", required: expiryRequired },
  ];
}

/** A validade do documento: na CNH, a `validUntil`. */
export function isExpiryField(field: DataField): boolean {
  return field === "expiresAt" || field === "validUntil";
}

/** Os valores do envio, para corrigir; vazios num envio pendente. */
export function dataValues(submission: Submission): DataValues {
  if (submission.kind === "DRIVER_CNH") {
    return {
      registrationNumber: submission.registrationNumber ?? "",
      category: submission.category ?? "",
      issueDate: submission.issueDate ?? "",
      validUntil: submission.expiresAt ?? "",
      firstLicenseDate: submission.firstLicenseDate ?? "",
      issuingState: submission.issuingState ?? "",
      securityNumber: submission.securityNumber ?? "",
    };
  }
  return {
    documentNumber: submission.documentNumber ?? "",
    expiresAt: submission.expiresAt ?? "",
  };
}

/** O que o admin digita num campo: os de dígitos só aceitam dígitos. */
export function normalizeInput(spec: FieldSpec, value: string): string {
  if (spec.input !== "digits") return value;
  const only = value.replace(/\D/g, "");
  return spec.maxLength ? only.slice(0, spec.maxLength) : only;
}

/** `expired` é a validade antes de hoje: o caminho é reprovar como vencido. */
export type FieldError = { message: string; expired?: boolean };
export type FieldErrors = Partial<Record<DataField, FieldError>>;

/**
 * O que a tela já sabe recusar antes de mandar. A API confere tudo de novo,
 * inclusive o limite de validade de cada tipo, e devolve o `field`.
 * Na correção (`allowPast`), a validade pode ser anterior a hoje (D25).
 */
export function validateData(
  fields: readonly FieldSpec[],
  values: DataValues,
  today: IsoDate,
  { allowPast }: { allowPast: boolean },
): FieldErrors {
  const errors: FieldErrors = {};
  for (const spec of fields) {
    const value = (values[spec.name] ?? "").trim();
    if (!value) {
      if (spec.required) errors[spec.name] = { message: data.errors.required };
      continue;
    }
    if (spec.input === "date" && !isIsoDate(value)) {
      errors[spec.name] = { message: data.errors.invalidDate };
    } else if (spec.name === "registrationNumber" && value.length < REGISTRATION_DIGITS.min) {
      errors[spec.name] = { message: data.errors.registrationLength };
    } else if (isExpiryField(spec.name) && !allowPast && value < today) {
      errors[spec.name] = { message: data.errors.expired, expired: true };
    } else if ((spec.name === "issueDate" || spec.name === "firstLicenseDate") && value > today) {
      errors[spec.name] = { message: data.errors.future };
    }
  }
  return errors;
}

/** O corpo com os dados: sem espaços nas pontas, e sem os campos em branco. */
export function dataBody(fields: readonly FieldSpec[], values: DataValues): SubmissionData {
  const body: Record<string, string> = {};
  for (const spec of fields) {
    const value = (values[spec.name] ?? "").trim();
    if (value) body[spec.name] = value;
  }
  return body as SubmissionData;
}

const FIELD_CODES = new Set<string>([
  "document.review.field_required",
  "document.expires_at.past",
  "document.expires_at.too_far",
  "driver_cnh.issue_date.future",
  "driver_cnh.registration.duplicate",
]);

/**
 * Os erros da API que caem num campo do formulário: os de formato vêm no
 * `errors[]`, um por campo; os de regra, com o `code` e um `field` só.
 * Um erro de campo que o formulário não tem fica de fora.
 */
export function problemFieldErrors(problem: ApiProblem, fields: readonly FieldSpec[]): FieldErrors {
  const names = new Set<string>(fields.map((spec) => spec.name));
  const errors: FieldErrors = {};
  const add = (field: string | null, error: FieldError) => {
    if (field && names.has(field) && !errors[field as DataField]) errors[field as DataField] = error;
  };

  for (const item of problem.errors) add(item.field, { message: item.message });

  const code = problem.code;
  if (code && FIELD_CODES.has(code)) {
    const field = problem.field ?? (code === "driver_cnh.registration.duplicate" ? "registrationNumber" : null);
    add(field, {
      message: messages.errors[code as keyof typeof messages.errors] ?? problem.detail ?? messages.errors.generic,
      expired: code === "document.expires_at.past",
    });
  } else if (problem.errors.length === 0 && problem.field && problem.detail) {
    add(problem.field, { message: problem.detail });
  }
  return errors;
}

/** O primeiro campo com erro, na ordem do formulário, para levar o foco até ele. */
export function firstErrorField(fields: readonly FieldSpec[], errors: FieldErrors): DataField | null {
  return fields.find((spec) => errors[spec.name])?.name ?? null;
}
