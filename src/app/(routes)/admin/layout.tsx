import type { Metadata } from "next";
import Link from "next/link";

import { t } from "@/lib/l10n";

const admin = t("admin");

export const metadata: Metadata = {
  title: admin.metaTitle,
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background-deep)]/70 p-6 sm:flex">
        <div className="mb-8">
          <p className="font-display text-lg font-bold text-foreground">{admin.sidebar.title}</p>
          <p className="text-sm text-muted-foreground">{admin.sidebar.subtitle}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/admin/clients"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            {admin.sidebar.clients}
          </Link>
          <span
            className="cursor-not-allowed rounded-lg px-4 py-2.5 text-sm text-muted-foreground/60"
            title={admin.sidebar.soon}
          >
            {admin.sidebar.drivers} · {admin.sidebar.soon}
          </span>
          <span
            className="cursor-not-allowed rounded-lg px-4 py-2.5 text-sm text-muted-foreground/60"
            title={admin.sidebar.soon}
          >
            {admin.sidebar.roles} · {admin.sidebar.soon}
          </span>
        </nav>

        <Link
          href="/"
          className="mt-8 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {admin.sidebar.backToSite}
        </Link>
      </aside>

      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
