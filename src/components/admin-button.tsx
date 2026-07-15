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
      aria-label={admin.metaTitle}
      title={admin.metaTitle}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[var(--background)] transition-colors hover:border-brand"
    >
      <CapybaraIcon />
    </Link>
  );
}

function CapybaraIcon() {
  return (
    <svg viewBox="0 0 64 48" className="h-6 w-6" aria-hidden="true">
      {/* corpo deitado */}
      <ellipse cx="36" cy="30" rx="24" ry="13" fill="#C08A4E" />
      {/* cabeça */}
      <rect x="2" y="10" width="22" height="19" rx="9" fill="#C08A4E" />
      {/* orelha */}
      <circle cx="20" cy="11" r="3" fill="#8F6236" />
      {/* olho */}
      <circle cx="10" cy="19" r="1.8" fill="#332412" />
      {/* focinho */}
      <rect x="2" y="22" width="7" height="5" rx="2.5" fill="#8F6236" />
      {/* pata dianteira dobrada */}
      <ellipse cx="20" cy="41" rx="5" ry="2.4" fill="#8F6236" />
    </svg>
  );
}
