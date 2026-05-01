import type { HumorFlavorStepRow } from "./types";

export type StepCompletenessInput = Pick<
  HumorFlavorStepRow,
  | "order_by"
  | "llm_system_prompt"
  | "llm_user_prompt"
  | "llm_model_id"
  | "llm_input_type_id"
  | "llm_output_type_id"
  | "humor_flavor_step_type_id"
  | "humor_flavor_id"
> & { flavor_id?: string | null };

/** True when a step has all required fields and non-empty system/user prompts. */
export function isHumorFlavorStepComplete(step: StepCompletenessInput): boolean {
  const sys = (step.llm_system_prompt ?? "").trim();
  const usr = (step.llm_user_prompt ?? "").trim();
  const sysIsPlaceholder = sys.toLowerCase() === "test";
  const usrIsPlaceholder = usr.toLowerCase() === "test";
  const hasFlavorLink =
    step.humor_flavor_id != null ||
    (step.flavor_id != null && String(step.flavor_id).trim() !== "");
  return (
    hasFlavorLink &&
    Number.isFinite(step.order_by) &&
    step.order_by >= 1 &&
    sys.length > 0 &&
    usr.length > 0 &&
    !sysIsPlaceholder &&
    !usrIsPlaceholder &&
    Number.isFinite(step.llm_model_id) &&
    step.llm_model_id >= 1 &&
    Number.isFinite(step.llm_input_type_id) &&
    step.llm_input_type_id >= 1 &&
    Number.isFinite(step.llm_output_type_id) &&
    step.llm_output_type_id >= 1 &&
    Number.isFinite(step.humor_flavor_step_type_id) &&
    step.humor_flavor_step_type_id >= 1
  );
}

/** Flavor is pipeline-ready: at least one step and every step is complete. */
export function isFlavorChainComplete(steps: HumorFlavorStepRow[]): boolean {
  if (steps.length === 0) {
    return false;
  }
  return steps.every(isHumorFlavorStepComplete);
}

export type FlavorStepBadgeState = "ready" | "no_steps" | "incomplete";

/** List/detail badge: no rows, partial pipeline, or fully ready for caption generation. */
export function computeFlavorStepBadgeState(
  steps: HumorFlavorStepRow[],
): FlavorStepBadgeState {
  if (steps.length === 0) {
    return "no_steps";
  }
  if (isFlavorChainComplete(steps)) {
    return "ready";
  }
  return "incomplete";
}
