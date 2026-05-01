import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";

/** Parse `Cookie` request header into `{ name, value }[]` (fallback when `cookies().getAll()` is empty). */
function cookiesFromHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader?.trim()) {
    return [];
  }
  const out: { name: string; value: string }[] = [];
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) {
      out.push({ name, value });
    }
  }
  return out;
}

export async function createClient() {
  // Ensure this runs in the context of an incoming request so `cookies()` is
  // populated (Server Actions / RSC can otherwise see an empty cookie store).
  await connection();

  const cookieStore = await cookies();
  const headerList = await headers();
  const rawCookieHeader = headerList.get("cookie");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const fromStore = cookieStore.getAll();
          if (fromStore.length > 0) {
            return fromStore;
          }
          return cookiesFromHeader(rawCookieHeader);
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Components cannot set cookies; proxy refreshes the session */
          }
        },
      },
    },
  );
}
