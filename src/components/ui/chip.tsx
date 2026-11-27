import type { ChipTone } from "@/lib/admin/driver-compliance/tone";

const TONE_CLASS: Record<ChipTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  warningOutline: "border border-warning-border bg-background text-warning",
  danger: "bg-danger-soft text-danger",
  dangerSolid: "bg-danger text-white",
  outline: "border border-dashed border-border-strong bg-background text-muted-foreground",
};

type ChipProps = {
  tone: ChipTone;
  children: React.ReactNode;
  className?: string;
};

/** Etiqueta de status: um tom e um texto curto. */
export function Chip({ tone, children, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
