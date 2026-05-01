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
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-gradient-to-b dark:from-slate-950 dark:via-zinc-950 dark:to-black dark:text-zinc-100">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[min(44rem,60vh)] bg-gradient-to-b from-red-500/[0.07] via-transparent to-transparent dark:from-red-600/25 dark:via-rose-950/10 dark:to-transparent"
        aria-hidden
      />
      <div className="relative">
        <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-800/60 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
              <Link
                href="/admin"
                className="inline-flex shrink-0 items-center rounded-full border border-zinc-200/90 bg-white/90 px-3.5 py-1.5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/65 dark:shadow-black/20"
              >
                <span className="text-sm font-bold tracking-tight">
                  <span className="text-red-600 dark:text-rose-400">Humor</span>
                  <span className="text-zinc-900 dark:text-white">Flavor</span>
                </span>
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
    </div>
  );
}
