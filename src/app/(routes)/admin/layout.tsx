import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav, AdminNavCompact } from "@/components/admin-nav";
import { Wordmark } from "@/components/wordmark";
import { t } from "@/lib/l10n";

const admin = t("admin");

export const metadata: Metadata = {
  title: admin.metaTitle,
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background-deep">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background px-4 py-6 sm:flex">
        <Link href="/" className="mb-8 block px-3">
          <Wordmark className="text-xl text-foreground" withTrail={false} />
          <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-brand">
            {admin.shortLabel}
          </span>
        </Link>

        <AdminNav />

        <Link
          href="/"
          className="mt-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BackIcon />
          {admin.sidebar.backToSite}
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-background sm:hidden">
          <div className="flex items-center justify-between px-6 pt-4">
            <Wordmark className="text-lg text-foreground" withTrail={false} />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              {admin.shortLabel}
            </span>
          </div>
          <AdminNavCompact />
        </div>

        <main className="flex-1 p-6 sm:p-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BackIcon() {
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
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </svg>
  );
}
