"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { HumorFlavorStepRow } from "./types";

export type StepActionState = { error: string } | null;

function parsePositiveInt(raw: FormDataEntryValue | null): number | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return n;
}

function parseFlavorIdParam(raw: FormDataEntryValue | null): string | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  return /^\d+$/.test(t) ? t : null;
}

function parseOptionalNumber(
  raw: FormDataEntryValue | null,
): number | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const s = raw.trim();
  if (s.length === 0) {
    return null;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n;
}

function nullableText(raw: FormDataEntryValue | null): string | null {
  if (raw == null || typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function revalidateFlavor(flavorId: string) {
  revalidatePath(`/admin/humor-flavors/${flavorId}`);
}

async function loadStepsForFlavor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  humorFlavorId: string,
): Promise<HumorFlavorStepRow[]> {
  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", humorFlavorId);

  if (error || !data) {
    return [];
  }

  const rows = data as HumorFlavorStepRow[];
  return [...rows].sort((a, b) => {
    if (a.order_by !== b.order_by) {
      return a.order_by - b.order_by;
    }
    return a.id - b.id;
  });
}

/**
 * After moving a step up or down in the sorted list, re-assign `order_by` to
 * 1..n for the whole chain so values stay contiguous and unique.
 */
export async function reorderHumorFlavorStep(formData: FormData) {
  const humorFlavorId = parseFlavorIdParam(formData.get("humor_flavor_id"));
  const stepIdRaw = parseFlavorIdParam(formData.get("step_id"));
  const direction = String(formData.get("direction") ?? "");

  if (
    !humorFlavorId ||
    !stepIdRaw ||
    (direction !== "up" && direction !== "down")
  ) {
    if (humorFlavorId) {
      redirect(`/admin/humor-flavors/${humorFlavorId}?step_error=invalid`);
    }
    redirect("/admin/humor-flavors?step_error=invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/admin/humor-flavors/${humorFlavorId}`);
  }

  const sorted = await loadStepsForFlavor(supabase, humorFlavorId);
  const idx = sorted.findIndex((s) => String(s.id) === stepIdRaw);
  if (idx < 0) {
    redirect(`/admin/humor-flavors/${humorFlavorId}`);
  }

  const nextOrder = [...sorted];
  if (direction === "up" && idx > 0) {
    [nextOrder[idx - 1], nextOrder[idx]] = [nextOrder[idx], nextOrder[idx - 1]];
  } else if (direction === "down" && idx < nextOrder.length - 1) {
    [nextOrder[idx], nextOrder[idx + 1]] = [nextOrder[idx + 1], nextOrder[idx]];
  } else {
    redirect(`/admin/humor-flavors/${humorFlavorId}`);
  }

  const now = new Date().toISOString();
  for (let i = 0; i < nextOrder.length; i++) {
    const want = i + 1;
    if (nextOrder[i].order_by === want) {
      continue;
    }
    const { error } = await supabase
      .from("humor_flavor_steps")
      .update({
        order_by: want,
        modified_by_user_id: user.id,
        modified_datetime_utc: now,
      })
      .eq("id", nextOrder[i].id)
      .eq("humor_flavor_id", humorFlavorId);

    if (error) {
      redirect(
        `/admin/humor-flavors/${humorFlavorId}?step_error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  revalidateFlavor(humorFlavorId);
  redirect(`/admin/humor-flavors/${humorFlavorId}`);
}

export async function deleteHumorFlavorStep(formData: FormData) {
  const humorFlavorId = parseFlavorIdParam(formData.get("humor_flavor_id"));
  const stepId = parseFlavorIdParam(formData.get("step_id"));

  if (!humorFlavorId || !stepId) {
    if (humorFlavorId) {
      redirect(`/admin/humor-flavors/${humorFlavorId}?step_error=invalid`);
    }
    redirect("/admin/humor-flavors?step_error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", stepId)
    .eq("humor_flavor_id", humorFlavorId);

  if (error) {
    redirect(
      `/admin/humor-flavors/${humorFlavorId}?step_error=${encodeURIComponent(error.message)}`,
    );
  }

  const remaining = await loadStepsForFlavor(supabase, humorFlavorId);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && remaining.length > 0) {
    const now = new Date().toISOString();
    for (let i = 0; i < remaining.length; i++) {
      const want = i + 1;
      if (remaining[i].order_by === want) {
        continue;
      }
      const { error: reErr } = await supabase
        .from("humor_flavor_steps")
        .update({
          order_by: want,
          modified_by_user_id: user.id,
          modified_datetime_utc: now,
        })
        .eq("id", remaining[i].id)
        .eq("humor_flavor_id", humorFlavorId);

      if (reErr) {
        redirect(
          `/admin/humor-flavors/${humorFlavorId}?step_error=${encodeURIComponent(reErr.message)}`,
        );
      }
    }
  }

  revalidateFlavor(humorFlavorId);
  redirect(`/admin/humor-flavors/${humorFlavorId}`);
}

export async function createHumorFlavorStep(
  _prev: StepActionState,
  formData: FormData,
): Promise<StepActionState> {
  const humorFlavorId = parseFlavorIdParam(formData.get("humor_flavor_id"));
  if (!humorFlavorId) {
    return { error: "Missing humor flavor." };
  }

  const llmInputTypeId = parsePositiveInt(formData.get("llm_input_type_id"));
  const llmOutputTypeId = parsePositiveInt(
    formData.get("llm_output_type_id"),
  );
  const llmModelId = parsePositiveInt(formData.get("llm_model_id"));
  const humorFlavorStepTypeId = parsePositiveInt(
    formData.get("humor_flavor_step_type_id"),
  );

  if (
    llmInputTypeId == null ||
    llmOutputTypeId == null ||
    llmModelId == null ||
    humorFlavorStepTypeId == null
  ) {
    return { error: "All type and model fields are required." };
  }

  const supabase = await createClient();
  const existing = await loadStepsForFlavor(supabase, humorFlavorId);
  const nextOrder =
    existing.length === 0
      ? 1
      : Math.max(...existing.map((r) => r.order_by)) + 1;

  const row = {
    humor_flavor_id: Number(humorFlavorId),
    order_by: nextOrder,
    llm_input_type_id: llmInputTypeId,
    llm_output_type_id: llmOutputTypeId,
    llm_model_id: llmModelId,
    humor_flavor_step_type_id: humorFlavorStepTypeId,
    llm_temperature: parseOptionalNumber(formData.get("llm_temperature")),
    llm_system_prompt: nullableText(formData.get("llm_system_prompt")),
    llm_user_prompt: nullableText(formData.get("llm_user_prompt")),
    description: nullableText(formData.get("description")),
  };

  const { error } = await supabase.from("humor_flavor_steps").insert(row);

  if (error) {
    return { error: error.message };
  }

  revalidateFlavor(humorFlavorId);
  redirect(`/admin/humor-flavors/${humorFlavorId}`);
}

export async function updateHumorFlavorStep(
  _prev: StepActionState,
  formData: FormData,
): Promise<StepActionState> {
  const humorFlavorId = parseFlavorIdParam(formData.get("humor_flavor_id"));
  const stepId = parseFlavorIdParam(formData.get("step_id"));

  if (!humorFlavorId || !stepId) {
    return { error: "Invalid step or flavor." };
  }

  const llmInputTypeId = parsePositiveInt(formData.get("llm_input_type_id"));
  const llmOutputTypeId = parsePositiveInt(
    formData.get("llm_output_type_id"),
  );
  const llmModelId = parsePositiveInt(formData.get("llm_model_id"));
  const humorFlavorStepTypeId = parsePositiveInt(
    formData.get("humor_flavor_step_type_id"),
  );

  if (
    llmInputTypeId == null ||
    llmOutputTypeId == null ||
    llmModelId == null ||
    humorFlavorStepTypeId == null
  ) {
    return { error: "All type and model fields are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({
      llm_input_type_id: llmInputTypeId,
      llm_output_type_id: llmOutputTypeId,
      llm_model_id: llmModelId,
      humor_flavor_step_type_id: humorFlavorStepTypeId,
      llm_temperature: parseOptionalNumber(formData.get("llm_temperature")),
      llm_system_prompt: nullableText(formData.get("llm_system_prompt")),
      llm_user_prompt: nullableText(formData.get("llm_user_prompt")),
      description: nullableText(formData.get("description")),
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", stepId)
    .eq("humor_flavor_id", humorFlavorId);

  if (error) {
    return { error: error.message };
  }

  revalidateFlavor(humorFlavorId);
  redirect(`/admin/humor-flavors/${humorFlavorId}`);
}
