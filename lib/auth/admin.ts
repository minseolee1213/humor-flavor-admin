import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminCheckResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

type ProfileFlags = {
  is_superadmin: boolean | null;
  is_matrix_admin: boolean | null;
};

/** Anon key + user session only; RLS applies. Expects `profiles.id` = auth user id (change `.eq` if your schema uses another FK). */
export async function checkAdminAccess(
  supabase: SupabaseClient,
): Promise<AdminCheckResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .maybeSingle<ProfileFlags>();

  if (error || !profile) {
    return { ok: false, reason: "forbidden" };
  }

  const isAdmin =
    profile.is_superadmin === true || profile.is_matrix_admin === true;

  if (!isAdmin) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true };
}
