"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/rating-stats", label: "Rating stats" },
  { href: "/admin/humor-flavors", label: "Humor flavors" },
  { href: "/admin/humor-mix", label: "Humor mix" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 sm:gap-2"
      aria-label="Admin sections"
    >
      {links.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-900/25 dark:from-red-600 dark:to-rose-500 dark:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.45)]"
                : "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/90 dark:hover:text-white"
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
