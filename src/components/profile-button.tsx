"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export function ProfileButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="fixed right-4 top-4 z-50 h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        aria-label="Entrar"
        title="Entrar"
        onClick={() => signIn("vanep", { callbackUrl: "/" })}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-foreground transition-opacity hover:opacity-80"
      >
        <ProfileIcon />
      </button>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "Conta";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        type="button"
        aria-label="Abrir menu da conta"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white transition-opacity hover:opacity-80 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {session.user?.email && (
              <p className="truncate text-xs text-[var(--muted-foreground)]">{session.user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/api/auth/sso-logout";
            }}
            className="block w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-[var(--muted)]"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
