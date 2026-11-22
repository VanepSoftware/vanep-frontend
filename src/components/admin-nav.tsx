"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useDriverReviewCounts } from "@/components/admin/driver-review-counts";
import { interpolate, t } from "@/lib/l10n";

const sidebar = t("admin").sidebar;
const queue = t("admin").driverReview.queue;

type NavItem = { href: string; label: string; badge?: "driverReview" };

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: sidebar.sectionLabel,
    items: [
      { href: "/admin/clients", label: sidebar.clients },
      { href: "/admin/drivers", label: sidebar.drivers, badge: "driverReview" }
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

/** Quantos motoristas precisam de ação do admin; nada quando é zero ou sem permissão. */
function useBadge(item: NavItem): number {
  const { counts } = useDriverReviewCounts();
  if (item.badge !== "driverReview" || !counts) return 0;
  return counts.badge;
}

function NavBadge({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={interpolate(queue.badgeLabel, { count })}
      className={`inline-flex h-5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
        active ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand-strong"
      }`}
    >
      {count}
    </span>
  );
}

function NavLink({ item, pathname, compact }: { item: NavItem; pathname: string; compact: boolean }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const badge = useBadge(item);
  const layout = compact ? "whitespace-nowrap px-3 py-1.5" : "px-3 py-2";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${layout} ${
        active
          ? "bg-brand-soft text-brand"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {item.label}
      <NavBadge count={badge} active={active} />
    </Link>
  );
}

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
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} compact={false} />
              </li>
            ))}
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
      {items.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} compact />
      ))}
    </nav>
  );
}
