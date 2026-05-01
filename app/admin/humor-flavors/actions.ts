"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  detectStepFlavorColumn,
  loadStepsForFlavor,
} from "@/lib/humor-flavor-steps/actions";
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
  const slug = String(
    formData.get("slug") ?? formData.get("name") ?? "",
  ).trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (!slug) {
    return { error: "Slug is required." };
  }

  const supabase = await createClient();

  // Hydrate cookie storage into the client so PostgREST requests include the JWT.
  // getUser() alone can succeed via network while insert still runs as anon if
  // no access_token is attached — then DB defaults/triggers see auth.uid() = null
  // and created_by_user_id stays null (NOT NULL violation).
  let {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
    if (refreshed.error && !session?.access_token) {
      console.log("[humor-flavors/create] no session after refresh", {
        sessionError: sessionError?.message ?? null,
        refreshError: refreshed.error.message,
      });
    }
  }

  if (!session?.access_token || !session.user?.id) {
    return {
      error:
        "Could not read your Supabase session for this request. Sign out and sign in again.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== session.user.id) {
    return { error: "Not signed in." };
  }

  const userId = session.user.id;
  const now = new Date().toISOString();
  const { error } = await supabase.from("humor_flavors").insert({
    slug,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
    created_by_user_id: userId,
    modified_by_user_id: userId,
    created_datetime_utc: now,
    modified_datetime_utc: now,
    is_pinned: false,
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
  const slug = String(
    formData.get("slug") ?? formData.get("name") ?? "",
  ).trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (!id) {
    return { error: "Invalid flavor id." };
  }
  if (!slug) {
    return { error: "Slug is required." };
  }

  const supabase = await createClient();

  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
  }
  if (!session?.access_token || !session.user?.id) {
    return {
      error:
        "Could not read your Supabase session for this request. Sign out and sign in again.",
    };
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== session.user.id) {
    return { error: "Not signed in." };
  }
  const userId = session.user.id;

  const { error } = await supabase
    .from("humor_flavors")
    .update({
      slug,
      description: descriptionRaw.length > 0 ? descriptionRaw : null,
      modified_by_user_id: userId,
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

export async function duplicateHumorFlavor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sourceId = parseFlavorId(formData.get("source_id"));
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();

  if (!sourceId) {
    return { error: "Invalid source flavor id." };
  }
  if (!slug) {
    return { error: "New slug is required." };
  }

  const supabase = await createClient();
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session ?? session;
  }
  if (!session?.access_token || !session.user?.id) {
    return {
      error:
        "Could not read your Supabase session for this request. Sign out and sign in again.",
    };
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== session.user.id) {
    return { error: "Not signed in." };
  }

  const { data: sourceFlavor, error: sourceErr } = await supabase
    .from("humor_flavors")
    .select("id, slug, description")
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceErr || !sourceFlavor) {
    return { error: "Source flavor does not exist." };
  }

  const { data: existingSlug, error: slugCheckErr } = await supabase
    .from("humor_flavors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugCheckErr) {
    return { error: slugCheckErr.message };
  }
  if (existingSlug) {
    return { error: "That slug is already in use. Choose a unique slug." };
  }

  const sourceSteps = await loadStepsForFlavor(supabase, sourceId);
  if (sourceSteps.length === 0) {
    return {
      error:
        "Source flavor has no prompt steps. Only flavors with at least one step can be duplicated.",
    };
  }

  const userId = user.id;
  const now = new Date().toISOString();
  const { data: insertedFlavor, error: insertFlavorErr } = await supabase
    .from("humor_flavors")
    .insert({
      slug,
      description:
        descriptionRaw.length > 0
          ? descriptionRaw
          : (sourceFlavor.description ?? null),
      created_by_user_id: userId,
      modified_by_user_id: userId,
      created_datetime_utc: now,
      modified_datetime_utc: now,
      is_pinned: false,
    })
    .select("id")
    .maybeSingle();
  if (insertFlavorErr || !insertedFlavor) {
    return { error: insertFlavorErr?.message ?? "Could not create duplicate flavor." };
  }

  const newFlavorId = String(insertedFlavor.id);
  const flavorColumn = await detectStepFlavorColumn(supabase, sourceId);
  const targetFk =
    flavorColumn === "humor_flavor_id" ? Number(insertedFlavor.id) : newFlavorId;

  const stepRows = sourceSteps.map((step) => ({
    [flavorColumn]: targetFk,
    order_by: step.order_by,
    llm_input_type_id: step.llm_input_type_id,
    llm_output_type_id: step.llm_output_type_id,
    llm_model_id: step.llm_model_id,
    humor_flavor_step_type_id: step.humor_flavor_step_type_id,
    llm_temperature: step.llm_temperature,
    llm_system_prompt: step.llm_system_prompt,
    llm_user_prompt: step.llm_user_prompt,
    description: step.description,
    created_by_user_id: userId,
    modified_by_user_id: userId,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  }));

  const { error: insertStepsErr } = await supabase
    .from("humor_flavor_steps")
    .insert(stepRows);
  if (insertStepsErr) {
    return {
      error: `Flavor was created (id ${newFlavorId}) but step copy failed: ${insertStepsErr.message}`,
    };
  }

  revalidatePath("/admin/humor-flavors");
  revalidatePath(`/admin/humor-flavors/${sourceId}`);
  revalidatePath(`/admin/humor-flavors/${newFlavorId}`);
  redirect(`/admin/humor-flavors/${newFlavorId}?dup=success`);
}
