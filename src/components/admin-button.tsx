"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { t } from "@/lib/l10n";

const admin = t("admin");

export function AdminButton() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || session?.user?.userType !== "ADMIN") {
    return null;
  }

  return (
    <Link
      href="/admin"
      title={admin.metaTitle}
      className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-background px-3 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:border-brand hover:bg-brand-soft hover:text-brand active:scale-[0.96]"
    >
      <ShieldIcon />
      {admin.shortLabel}
    </Link>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 4 6.5v5c0 4.4 3.2 8.4 8 9.5 4.8-1.1 8-5.1 8-9.5v-5L12 3Z" />
    </svg>
  );
}
