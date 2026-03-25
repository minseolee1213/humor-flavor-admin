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
    const safeNext =
      pathname.startsWith("/admin") && !pathname.startsWith("//")
        ? pathname
        : "/admin";
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  if (!result.ok) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Admin
          </Link>
          <AdminNav />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
