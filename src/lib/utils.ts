import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind, e a última vence quando duas brigam (padrão do shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
