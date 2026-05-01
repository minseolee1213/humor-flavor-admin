"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isFlavorChainComplete } from "./step-complete";
import type { HumorFlavorStepRow } from "./types";

export type StepActionState = { error: string } | null;
type StepFlavorColumn = "humor_flavor_id" | "flavor_id";
let cachedStepFlavorColumn: StepFlavorColumn | null = null;

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
  if (/^\d+$/.test(t)) return t;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)) {
    return t;
  }
  return null;
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

function requiredTrimmedText(
  raw: FormDataEntryValue | null,
  fieldLabel: string,
): { ok: true; value: string } | { ok: false; error: StepActionState } {
  if (raw == null || typeof raw !== "string") {
    return { ok: false, error: { error: `${fieldLabel} is required.` } };
  }
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: false, error: { error: `${fieldLabel} is required.` } };
  }
  return { ok: true, value: t };
}

function validatePromptValue(
  value: string,
  fieldLabel: string,
): StepActionState {
  if (value.trim().toLowerCase() === "test") {
    return {
      error: `${fieldLabel} cannot be "test". Use a real prompt.`,
    };
  }
  return null;
}

function revalidateFlavor(flavorId: string) {
  revalidatePath(`/admin/humor-flavors/${flavorId}`);
}

export async function detectStepFlavorColumn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  flavorId: string,
): Promise<StepFlavorColumn> {
  if (cachedStepFlavorColumn) {
    return cachedStepFlavorColumn;
  }

  const tryHumorFlavor = await supabase
    .from("humor_flavor_steps")
    .select("id")
    .eq("humor_flavor_id", flavorId)
    .limit(1);
  if (!tryHumorFlavor.error) {
    cachedStepFlavorColumn = "humor_flavor_id";
    return cachedStepFlavorColumn;
  }

  const tryFlavor = await supabase
    .from("humor_flavor_steps")
    .select("id")
    .eq("flavor_id", flavorId)
    .limit(1);
  if (!tryFlavor.error) {
    cachedStepFlavorColumn = "flavor_id";
    return cachedStepFlavorColumn;
  }

  cachedStepFlavorColumn = "humor_flavor_id";
  return cachedStepFlavorColumn;
}

export async function loadStepsForFlavor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  humorFlavorId: string,
): Promise<HumorFlavorStepRow[]> {
  const flavorColumn = await detectStepFlavorColumn(supabase, humorFlavorId);
  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq(flavorColumn, humorFlavorId);

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

function buildStepSignature(parts: {
  llmInputTypeId: number;
  llmOutputTypeId: number;
  humorFlavorStepTypeId: number;
  llmModelId: number;
}): string {
  return [
    parts.llmInputTypeId,
    parts.llmOutputTypeId,
    parts.humorFlavorStepTypeId,
    parts.llmModelId,
  ].join(":");
}

async function loadKnownWorkingStepSignatures(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data: recentCaptionRows } = await supabase
    .from("captions")
    .select("humor_flavor_id")
    .not("humor_flavor_id", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(5000);

  const flavorIds = [
    ...new Set(
      (recentCaptionRows ?? [])
        .map((r) => r.humor_flavor_id)
        .filter((v): v is number => typeof v === "number"),
    ),
  ];
  if (flavorIds.length === 0) {
    return new Set<string>();
  }

  const flavorColumn = await detectStepFlavorColumn(
    supabase,
    String(flavorIds[0]),
  );
  const filterValues =
    flavorColumn === "humor_flavor_id"
      ? flavorIds
      : flavorIds.map((id) => String(id));

  const { data: steps } = await supabase
    .from("humor_flavor_steps")
    .select(
      "llm_input_type_id,llm_output_type_id,humor_flavor_step_type_id,llm_model_id,llm_system_prompt,llm_user_prompt,order_by",
    )
    .in(flavorColumn, filterValues);

  const allowed = new Set<string>();
  for (const step of steps ?? []) {
    const llmInputTypeId = Number(step.llm_input_type_id);
    const llmOutputTypeId = Number(step.llm_output_type_id);
    const humorFlavorStepTypeId = Number(step.humor_flavor_step_type_id);
    const llmModelId = Number(step.llm_model_id);
    const orderBy = Number(step.order_by);
    const sys = String(step.llm_system_prompt ?? "").trim();
    const usr = String(step.llm_user_prompt ?? "").trim();
    if (
      Number.isFinite(llmInputTypeId) &&
      llmInputTypeId > 0 &&
      Number.isFinite(llmOutputTypeId) &&
      llmOutputTypeId > 0 &&
      Number.isFinite(humorFlavorStepTypeId) &&
      humorFlavorStepTypeId > 0 &&
      Number.isFinite(llmModelId) &&
      llmModelId > 0 &&
      Number.isFinite(orderBy) &&
      orderBy > 0 &&
      sys.length > 0 &&
      usr.length > 0
    ) {
      allowed.add(
        buildStepSignature({
          llmInputTypeId,
          llmOutputTypeId,
          humorFlavorStepTypeId,
          llmModelId,
        }),
      );
    }
  }
  return allowed;
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
  const flavorColumn = await detectStepFlavorColumn(supabase, humorFlavorId);
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
      .eq(flavorColumn, humorFlavorId);

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
  const flavorColumn = await detectStepFlavorColumn(supabase, humorFlavorId);
  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", stepId)
    .eq(flavorColumn, humorFlavorId);

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
        .eq(flavorColumn, humorFlavorId);

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
    return { error: "Humor flavor id is required." };
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

  const sysPrompt = requiredTrimmedText(
    formData.get("llm_system_prompt"),
    "System prompt",
  );
  if (!sysPrompt.ok) {
    return sysPrompt.error;
  }
  const userPrompt = requiredTrimmedText(
    formData.get("llm_user_prompt"),
    "User prompt",
  );
  if (!userPrompt.ok) {
    return userPrompt.error;
  }
  const sysPromptValidation = validatePromptValue(
    sysPrompt.value,
    "System prompt",
  );
  if (sysPromptValidation) {
    return sysPromptValidation;
  }
  const userPromptValidation = validatePromptValue(
    userPrompt.value,
    "User prompt",
  );
  if (userPromptValidation) {
    return userPromptValidation;
  }

  const supabase = await createClient();
  const flavorColumn = await detectStepFlavorColumn(supabase, humorFlavorId);
  const existing = await loadStepsForFlavor(supabase, humorFlavorId);
  const nextOrder =
    existing.length === 0
      ? 1
      : Math.max(...existing.map((r) => r.order_by)) + 1;

  if (!Number.isFinite(nextOrder) || nextOrder < 1) {
    return { error: "Invalid step order (order_by)." };
  }

  const row = {
    [flavorColumn]: humorFlavorId,
    order_by: nextOrder,
    llm_input_type_id: llmInputTypeId,
    llm_output_type_id: llmOutputTypeId,
    llm_model_id: llmModelId,
    humor_flavor_step_type_id: humorFlavorStepTypeId,
    llm_temperature: parseOptionalNumber(formData.get("llm_temperature")),
    llm_system_prompt: sysPrompt.value,
    llm_user_prompt: userPrompt.value,
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
  const requestedOrder = parsePositiveInt(formData.get("order_by"));

  if (
    llmInputTypeId == null ||
    llmOutputTypeId == null ||
    llmModelId == null ||
    humorFlavorStepTypeId == null ||
    requestedOrder == null
  ) {
    return { error: "All required fields (including order) must be valid." };
  }

  const sysPrompt = requiredTrimmedText(
    formData.get("llm_system_prompt"),
    "System prompt",
  );
  if (!sysPrompt.ok) {
    return sysPrompt.error;
  }
  const userPrompt = requiredTrimmedText(
    formData.get("llm_user_prompt"),
    "User prompt",
  );
  if (!userPrompt.ok) {
    return userPrompt.error;
  }
  const sysPromptValidation = validatePromptValue(
    sysPrompt.value,
    "System prompt",
  );
  if (sysPromptValidation) {
    return sysPromptValidation;
  }
  const userPromptValidation = validatePromptValue(
    userPrompt.value,
    "User prompt",
  );
  if (userPromptValidation) {
    return userPromptValidation;
  }

  const supabase = await createClient();
  const allowedSignatures = await loadKnownWorkingStepSignatures(supabase);
  const flavorColumn = await detectStepFlavorColumn(supabase, humorFlavorId);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: existingStep, error: loadErr } = await supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("id", stepId)
    .eq(flavorColumn, humorFlavorId)
    .maybeSingle();
  if (loadErr || !existingStep) {
    return { error: "Step not found for this flavor." };
  }
  if (
    !Number.isFinite(existingStep.order_by) ||
    (existingStep.order_by as number) < 1
  ) {
    return { error: "Invalid step order (order_by)." };
  }

  const sorted = await loadStepsForFlavor(supabase, humorFlavorId);
  const currentIndex = sorted.findIndex((s) => String(s.id) === stepId);
  if (currentIndex < 0) {
    return { error: "Step not found for this flavor." };
  }
  const currentStep = sorted[currentIndex];
  const requestedSignature = buildStepSignature({
    llmInputTypeId,
    llmOutputTypeId,
    humorFlavorStepTypeId,
    llmModelId,
  });
  const currentSignature = buildStepSignature({
    llmInputTypeId: currentStep.llm_input_type_id,
    llmOutputTypeId: currentStep.llm_output_type_id,
    humorFlavorStepTypeId: currentStep.humor_flavor_step_type_id,
    llmModelId: currentStep.llm_model_id,
  });
  if (
    requestedSignature !== currentSignature &&
    !allowedSignatures.has(requestedSignature)
  ) {
    return {
      error:
        "Changing to this type/model combination is blocked because it is not in known-working templates.",
    };
  }

  const moving = sorted[currentIndex];
  const remaining = sorted.filter((s) => String(s.id) !== stepId);
  const boundedOrder = Math.min(Math.max(requestedOrder, 1), sorted.length);
  remaining.splice(boundedOrder - 1, 0, moving);

  const now = new Date().toISOString();
  for (let i = 0; i < remaining.length; i++) {
    const step = remaining[i];
    const wantOrder = i + 1;
    const isCurrent = String(step.id) === stepId;

    if (isCurrent) {
      const { error } = await supabase
        .from("humor_flavor_steps")
        .update({
          order_by: wantOrder,
          llm_input_type_id: llmInputTypeId,
          llm_output_type_id: llmOutputTypeId,
          llm_model_id: llmModelId,
          humor_flavor_step_type_id: humorFlavorStepTypeId,
          llm_temperature: parseOptionalNumber(formData.get("llm_temperature")),
          llm_system_prompt: sysPrompt.value,
          llm_user_prompt: userPrompt.value,
          description: nullableText(formData.get("description")),
          modified_by_user_id: user.id,
          modified_datetime_utc: now,
        })
        .eq("id", stepId)
        .eq(flavorColumn, humorFlavorId);
      if (error) {
        return { error: error.message };
      }
      continue;
    }

    if (step.order_by === wantOrder) {
      continue;
    }
    const { error } = await supabase
      .from("humor_flavor_steps")
      .update({
        order_by: wantOrder,
        modified_by_user_id: user.id,
        modified_datetime_utc: now,
      })
      .eq("id", step.id)
      .eq(flavorColumn, humorFlavorId);
    if (error) {
      return { error: error.message };
    }
  }

  revalidateFlavor(humorFlavorId);
  redirect(`/admin/humor-flavors/${humorFlavorId}`);
}

export type CopyFlavorStepsState = { error: string } | null;

/** Insert copies of source steps onto target (target must have zero steps). Source rows are not modified. */
export async function copyHumorFlavorStepsFromSource(
  _prev: CopyFlavorStepsState,
  formData: FormData,
): Promise<CopyFlavorStepsState> {
  const targetId = parseFlavorIdParam(formData.get("target_flavor_id"));
  const sourceId = parseFlavorIdParam(formData.get("source_flavor_id"));
  if (!targetId || !sourceId || targetId === sourceId) {
    return { error: "Choose a valid source flavor different from this one." };
  }
  if (formData.get("acknowledge") !== "on") {
    return { error: "Check the confirmation box before copying steps." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const targetSteps = await loadStepsForFlavor(supabase, targetId);
  if (targetSteps.length > 0) {
    return {
      error:
        "This flavor already has steps. Copy is only offered for flavors with no steps.",
    };
  }

  const sourceSteps = await loadStepsForFlavor(supabase, sourceId);
  if (sourceSteps.length === 0) {
    return { error: "The source flavor has no steps to copy." };
  }
  if (!isFlavorChainComplete(sourceSteps)) {
    return {
      error:
        "The source flavor must have a complete prompt chain (all required fields and prompts) before it can be used as a template.",
    };
  }
  const { count: sourceCaptionCount, error: sourceCaptionCountError } =
    await supabase
      .from("captions")
      .select("id", { count: "exact", head: true })
      .eq("humor_flavor_id", sourceId);
  if (sourceCaptionCountError) {
    return { error: sourceCaptionCountError.message };
  }
  if ((sourceCaptionCount ?? 0) < 1) {
    return {
      error:
        "Choose a known-working source flavor that has generated at least one caption.",
    };
  }

  const flavorColumn = await detectStepFlavorColumn(supabase, targetId);
  const fkValue =
    flavorColumn === "humor_flavor_id" ? Number(targetId) : targetId;

  const now = new Date().toISOString();
  const sorted = [...sourceSteps].sort((a, b) => {
    if (a.order_by !== b.order_by) {
      return a.order_by - b.order_by;
    }
    return a.id - b.id;
  });

  const rows = sorted.map((s) => ({
    [flavorColumn]: fkValue,
    order_by: s.order_by,
    llm_input_type_id: s.llm_input_type_id,
    llm_output_type_id: s.llm_output_type_id,
    llm_model_id: s.llm_model_id,
    humor_flavor_step_type_id: s.humor_flavor_step_type_id,
    llm_temperature: s.llm_temperature,
    llm_system_prompt: s.llm_system_prompt,
    llm_user_prompt: s.llm_user_prompt,
    description: s.description,
    created_by_user_id: user.id,
    modified_by_user_id: user.id,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  }));

  const { error } = await supabase.from("humor_flavor_steps").insert(rows);
  if (error) {
    return { error: error.message };
  }

  revalidateFlavor(targetId);
  revalidatePath("/admin/humor-flavors");
  redirect(
    `/admin/humor-flavors/${targetId}?copied=1&copied_from=${encodeURIComponent(sourceId)}`,
  );
}
