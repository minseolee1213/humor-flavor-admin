"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/humor-flavors", label: "Humor flavors" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Admin sections">
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
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
