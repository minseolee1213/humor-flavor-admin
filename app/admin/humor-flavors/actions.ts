"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

function parseFlavorId(raw: FormDataEntryValue | null): string | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

export async function createHumorFlavor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (!slug) {
    return { error: "Slug is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("humor_flavors").insert({
    slug,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/humor-flavors");
  redirect("/admin/humor-flavors");
}

export async function updateHumorFlavor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = parseFlavorId(formData.get("id"));
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (!id) {
    return { error: "Invalid flavor id." };
  }
  if (!slug) {
    return { error: "Slug is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("humor_flavors")
    .update({
      slug,
      description: descriptionRaw.length > 0 ? descriptionRaw : null,
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/humor-flavors");
  revalidatePath(`/admin/humor-flavors/${id}`);
  revalidatePath(`/admin/humor-flavors/${id}/edit`);
  redirect(`/admin/humor-flavors/${id}`);
}

export async function deleteHumorFlavor(formData: FormData) {
  const id = parseFlavorId(formData.get("id"));
  if (!id) {
    redirect("/admin/humor-flavors?error=invalid_id");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("humor_flavors").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/humor-flavors?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/humor-flavors");
  redirect("/admin/humor-flavors");
}
