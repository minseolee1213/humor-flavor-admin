"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { loadStepsForFlavor } from "@/lib/humor-flavor-steps/actions";
import { isFlavorChainComplete } from "@/lib/humor-flavor-steps/step-complete";
import { createClient } from "@/lib/supabase/server";

function parsePositiveIntParam(
  raw: FormDataEntryValue | null,
): number | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return n;
}

async function requireSessionUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
  }
  if (!session?.access_token || !session.user?.id) {
    return null;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || user.id !== session.user.id) {
    return null;
  }
  return session.user.id;
}

export async function addHumorFlavorToMix(formData: FormData) {
  const humorFlavorIdNum = parsePositiveIntParam(
    formData.get("humor_flavor_id"),
  );
  if (humorFlavorIdNum == null) {
    redirect("/admin/humor-mix?error=invalid_flavor");
  }

  const supabase = await createClient();
  const userId = await requireSessionUserId(supabase);
  if (!userId) {
    redirect("/login?next=/admin/humor-mix");
  }

  const steps = await loadStepsForFlavor(supabase, String(humorFlavorIdNum));
  if (!isFlavorChainComplete(steps)) {
    redirect(
      `/admin/humor-mix?error=incomplete_steps&flavor_id=${humorFlavorIdNum}`,
    );
  }

  const { data: existing } = await supabase
    .from("humor_flavor_mix")
    .select("id")
    .eq("humor_flavor_id", humorFlavorIdNum)
    .maybeSingle();

  if (existing) {
    redirect("/admin/humor-mix?error=already_in_mix");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("humor_flavor_mix").insert({
    humor_flavor_id: humorFlavorIdNum,
    caption_count: 0,
    created_by_user_id: userId,
    modified_by_user_id: userId,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  });

  if (error) {
    redirect(`/admin/humor-mix?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/humor-mix");
  redirect("/admin/humor-mix");
}

export async function removeHumorFlavorFromMix(formData: FormData) {
  const mixRowId = parsePositiveIntParam(formData.get("id"));
  if (mixRowId == null) {
    redirect("/admin/humor-mix?error=invalid_id");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavor_mix")
    .delete()
    .eq("id", mixRowId);

  if (error) {
    redirect(`/admin/humor-mix?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/humor-mix");
  redirect("/admin/humor-mix");
}
