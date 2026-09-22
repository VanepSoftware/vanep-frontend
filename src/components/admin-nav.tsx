"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t } from "@/lib/l10n";

const sidebar = t("admin").sidebar;

type NavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

const groups: NavGroup[] = [
  {
    label: sidebar.sectionLabel,
    items: [
      { href: "/admin/clients", label: sidebar.clients },
      { href: "/admin/drivers", label: sidebar.drivers }
    ]
  },
  {
    label: sidebar.accessLabel,
    items: [
      { href: "/admin/roles", label: sidebar.roles },
      { href: "/admin/permissions", label: sidebar.permissions }
    ]
  }
];

/** Navegação lateral do painel, com destaque para a rota atual. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-7">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Versão horizontal usada no topo em telas pequenas. */
export function AdminNavCompact() {
  const pathname = usePathname();
  const items = groups.flatMap((group) => group.items);

  return (
    <nav className="flex gap-2 overflow-x-auto px-6 py-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
              active
                ? "bg-brand-soft text-brand"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
