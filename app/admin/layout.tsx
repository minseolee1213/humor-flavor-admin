import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { checkAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const result = await checkAdminAccess(supabase);

  if (!result.ok && result.reason === "unauthenticated") {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") ?? "/admin";
    const safeNext = (() => {
      const candidate = pathname.trim();
      if (!candidate) return "/admin";
      if (!candidate.startsWith("/")) return "/admin";
      if (candidate.startsWith("//")) return "/admin";
      if (candidate.includes("://")) return "/admin";
      if (!/^\/admin(?:\/|$)/.test(candidate)) return "/admin";
      if (/%2f/i.test(candidate)) return "/admin";
      if (/[\\\s]/.test(candidate)) return "/admin";
      if (candidate.includes("?") || candidate.includes("#")) return "/admin";
      return candidate;
    })();

    console.log("[auth/admin-layout] unauthenticated; redirecting to login", {
      incomingPathname: pathname,
      sanitizedNext: safeNext,
    });
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  if (!result.ok) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
            <Link
              href="/admin"
              className="shrink-0 text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
            >
              <span className="text-red-600 dark:text-[var(--accent)]">
                Humor
              </span>
              <span className="text-zinc-800 dark:text-zinc-100">Flavor</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
