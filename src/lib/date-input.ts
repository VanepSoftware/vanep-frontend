/**
 * Data digitada como "dd/mm/aaaa" e guardada como ISO ("aaaa-mm-dd"), que é o
 * que a API recebe. Enquanto o admin digita, o valor é o texto parcial.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const TYPED = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Uma data ISO que existe no calendário (recusa 31/02). */
export function isIsoDate(value: string): boolean {
  const match = ISO.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** O que aparece no campo: a ISO vira "dd/mm/aaaa"; o texto parcial fica como está. */
export function displayDate(value: string): string {
  const match = ISO.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/**
 * O que o admin digitou, com as barras no lugar. Completa e válida, vira ISO;
 * senão, o texto parcial, que a validação recusa.
 */
export function typedDate(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
  const match = TYPED.exec(masked);
  if (!match) return masked;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return isIsoDate(iso) ? iso : masked;
}

/** A ISO como data local, para o calendário. */
export function isoToDate(value: string): Date | undefined {
  if (!isIsoDate(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** A data escolhida no calendário, como ISO. */
export function dateToIso(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
