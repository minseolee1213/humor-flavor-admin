import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const incomingNextRaw = url.searchParams.get("next");

  console.log("[auth/callback] hit", {
    codePresent: Boolean(code),
    incomingNextRaw,
  });

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log("[auth/callback] exchangeCodeForSession error", {
        message: error.message,
      });
      return NextResponse.redirect(new URL("/login?error=auth", url.origin));
    }

    const sessionUser = data.session?.user;

    console.log("[auth/callback] auth user after exchange", {
      authUserId: sessionUser?.id ?? null,
      authUserEmail: sessionUser?.email ?? null,
    });

    // Verify session cookies exist after exchange (avoid printing token values).
    try {
      const store = await cookies();
      const sbCookies = store
        .getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .map((c) => ({ name: c.name, present: Boolean(c.value) }));
      console.log("[auth/callback] sb cookies after exchange", sbCookies);
    } catch {
      // ignore logging failures
    }

    if (!sessionUser) {
      return NextResponse.redirect(new URL("/unauthorized", url.origin));
    }

    // Google login only (matches your old working pattern).
    const provider = (sessionUser as any)?.app_metadata?.provider;
    const hasGoogleIdentity = Array.isArray((sessionUser as any)?.identities)
      ? (sessionUser as any).identities.some(
          (identity: any) => identity?.provider === "google",
        )
      : false;

    if (provider !== "google" && !hasGoogleIdentity) {
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    const admin = await checkAdminAccess(supabase);
    if (admin.ok) {
      return NextResponse.redirect(new URL("/admin", url.origin));
    }

    return NextResponse.redirect(new URL("/unauthorized", url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
