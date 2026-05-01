"use client";

import { useActionState } from "react";

import {
  type StepActionState,
  updateHumorFlavorStep,
} from "@/lib/humor-flavor-steps/actions";
import type {
  HumorFlavorStepRow,
  LookupOption,
} from "@/lib/humor-flavor-steps/types";

function FieldLabel({
  htmlFor,
  children,
  required: req,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-300"
    >
      {children}
      {req ? <span className="text-red-600 dark:text-red-400"> *</span> : null}
    </label>
  );
}

type Props = {
  humorFlavorId: string;
  step: HumorFlavorStepRow;
  inputTypes: LookupOption[];
  outputTypes: LookupOption[];
  models: LookupOption[];
  stepTypes: LookupOption[];
};

export function EditHumorFlavorStepForm({
  humorFlavorId,
  step,
  inputTypes,
  outputTypes,
  models,
  stepTypes,
}: Props) {
  const [state, formAction, pending] = useActionState<
    StepActionState,
    FormData
  >(updateHumorFlavorStep, null);

  const sid = `edit-${step.id}`;
  const inLabel =
    inputTypes.find((o) => o.id === step.llm_input_type_id)?.label ??
    String(step.llm_input_type_id);
  const outLabel =
    outputTypes.find((o) => o.id === step.llm_output_type_id)?.label ??
    String(step.llm_output_type_id);
  const modelLabel =
    models.find((o) => o.id === step.llm_model_id)?.label ??
    String(step.llm_model_id);
  const stepTypeLabel =
    stepTypes.find((o) => o.id === step.humor_flavor_step_type_id)?.label ??
    String(step.humor_flavor_step_type_id);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />
      <input type="hidden" name="step_id" value={String(step.id)} />
      <input type="hidden" name="order_by" value={String(step.order_by)} />
      <input
        type="hidden"
        name="humor_flavor_step_type_id"
        value={String(step.humor_flavor_step_type_id)}
      />
      <input type="hidden" name="llm_model_id" value={String(step.llm_model_id)} />
      <input
        type="hidden"
        name="llm_input_type_id"
        value={String(step.llm_input_type_id)}
      />
      <input
        type="hidden"
        name="llm_output_type_id"
        value={String(step.llm_output_type_id)}
      />
      <input
        type="hidden"
        name="llm_temperature"
        value={step.llm_temperature == null ? "" : String(step.llm_temperature)}
      />
      {state?.error ? (
        <div className="app-alert-error sm:col-span-2 text-xs" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          Manual custom step type/model changes can break generation. Keep the
          template pipeline structure and edit humor style wording only.
        </div>
      </div>

      <div className="sm:col-span-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        <div className="font-medium">Locked pipeline structure</div>
        <div className="mt-1 font-mono">
          order:{step.order_by} step:{stepTypeLabel} model:{modelLabel} in:
          {inLabel} out:{outLabel} temp:{step.llm_temperature ?? "—"}
        </div>
        <p className="mt-2">
          If your flavor works without steps but fails with steps, your steps do
          not match the API&apos;s expected pipeline structure.
        </p>
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-desc`}>Description</FieldLabel>
        <input
          id={`${sid}-desc`}
          name="description"
          type="text"
          defaultValue={step.description ?? ""}
          className="app-input"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-sys`} required>
          System prompt (style wording)
        </FieldLabel>
        <textarea
          id={`${sid}-sys`}
          name="llm_system_prompt"
          rows={3}
          required
          defaultValue={step.llm_system_prompt ?? ""}
          className="app-input min-h-[5rem]"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-user`} required>
          User prompt (style wording)
        </FieldLabel>
        <textarea
          id={`${sid}-user`}
          name="llm_user_prompt"
          rows={3}
          required
          defaultValue={step.llm_user_prompt ?? ""}
          className="app-input min-h-[5rem]"
        />
      </div>

      <div className="sm:col-span-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        No inactive/enabled column exists in the confirmed step schema, so
        steps cannot be marked inactive.
      </div>

      <div className="sm:col-span-2 pt-1">
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Saving…" : "Save step"}
        </button>
      </div>
    </form>
  );
}
