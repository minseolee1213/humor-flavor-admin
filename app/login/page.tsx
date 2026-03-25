import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { checkAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | string[] | undefined): string {
  const candidate =
    typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : "";

  // Allowed:
  // - must start with "/"
  // - must start with "/admin"
  // - must NOT start with "//"
  // - must NOT be a full URL
  if (!candidate) return "/admin";
  if (!candidate.startsWith("/")) return "/admin";
  if (candidate.startsWith("//")) return "/admin";
  if (candidate.includes("://")) return "/admin";
  if (!/^\/admin(?:\/|$)/.test(candidate)) return "/admin";

  if (/%2f/i.test(candidate)) return "/admin";
  if (/[\r\n]/.test(candidate)) return "/admin";
  if (/[\\\s]/.test(candidate)) return "/admin"; // backslash or whitespace
  if (candidate.includes("?") || candidate.includes("#")) return "/admin";

  return candidate;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const incomingNextRaw = params.next;
  const next = safeNextPath(
    typeof params.next === "string"
      ? params.next
      : Array.isArray(params.next)
        ? params.next[0]
        : undefined,
  );

  console.log("[auth/login] incoming next", {
    incomingNextRaw,
    sanitizedNext: next,
  });
  const authError =
    typeof params.error === "string" ? params.error : undefined;

  const supabase = await createClient();
  const admin = await checkAdminAccess(supabase);

  if (admin.ok) {
    console.log("[auth/login] redirecting to", { destination: next });
    redirect(next);
  }

  if (admin.reason === "forbidden") {
    redirect("/unauthorized");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-zinc-100">
      {/* Cinematic gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(229,9,20,0.28),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(120,50,255,0.08),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,transparent_35%,rgba(0,0,0,0.65)_100%)]"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Hero / brand */}
        <div className="flex flex-1 flex-col justify-center px-6 pb-10 pt-16 sm:px-10 lg:max-w-[46%] lg:px-14 lg:pb-16 lg:pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500/90">
            Course admin
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[2.75rem] xl:text-6xl">
            Humor Flavor
            <span className="block bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
            Configure humor flavors, prompt chains, and caption pipelines. A
            focused control room for your backend—built to feel as serious as
            the product it manages.
          </p>
          <div className="mt-10 hidden h-px w-24 bg-gradient-to-r from-red-600/80 to-transparent lg:block" />
        </div>

        {/* Sign-in card */}
        <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-8 lg:px-12 lg:pb-20 lg:pt-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-10">
              <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                Sign in to continue
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-500">
                Use your authorized Google account. Access is restricted to
                admins.
              </p>
              {authError ? (
                <p
                  className="app-alert-error mt-6 text-center"
                  role="alert"
                >
                  Sign-in did not complete. Try again.
                </p>
              ) : null}
              <div className="mt-8">
                <GoogleSignInButton nextPath={next} />
              </div>
            </div>
            <p className="mt-8 text-center text-xs text-zinc-600">
              By signing in you agree to your institution&apos;s acceptable use
              policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
