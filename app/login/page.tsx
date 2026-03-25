import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { checkAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string"
      ? params.next
      : Array.isArray(params.next)
        ? params.next[0]
        : undefined,
  );
  const authError =
    typeof params.error === "string" ? params.error : undefined;

  const supabase = await createClient();
  const admin = await checkAdminAccess(supabase);

  if (admin.ok) {
    redirect(next);
  }

  if (admin.reason === "forbidden") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        </div>
        {authError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            Sign-in did not complete. Try again.
          </p>
        ) : null}
        <GoogleSignInButton nextPath={next} />
      </div>
    </div>
  );
}
