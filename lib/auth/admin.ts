import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminCheckResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

type ProfileFlags = {
  is_superadmin: boolean | null;
};

/** Anon key + user session only; RLS applies. Expects `profiles.id` = auth user id (change `.eq` if your schema uses another FK). */
export async function checkAdminAccess(
  supabase: SupabaseClient,
): Promise<AdminCheckResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[auth/admin] no auth user", {
      computedIsAdmin: false,
    });
    return { ok: false, reason: "unauthenticated" };
  }

  const authUserId = user.id;
  const authUserEmail = user.email ?? null;

  // Important for auth reliability: select only `is_superadmin`.
  // If RLS/permissions restrict `is_matrix_admin`, selecting it can cause
  // the whole query to fail and make valid admins appear forbidden.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle<ProfileFlags>();

  const profileId = authUserId;
  const profileEmail = authUserEmail;
  const is_superadmin = profile?.is_superadmin ?? null;
  // Debugging simplification: only `is_superadmin` determines admin access.
  // Once the login flow is stable, we can re-add `is_matrix_admin` if needed.
  const computedIsAdmin = is_superadmin === true;

  console.log("[auth/admin] admin check", {
    authUserId,
    authUserEmail,
    matchedProfileId: profileId,
    matchedProfileEmail: profileEmail,
    is_superadmin,
    computedIsAdmin,
    dbProfileFound: Boolean(profile),
    dbProfileError: error?.message ?? null,
  });

  if (error || !profile) {
    return { ok: false, reason: "forbidden" };
  }

  const isAdmin = computedIsAdmin;

  if (!isAdmin) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true };
}
