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
      className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />
      <input type="hidden" name="step_id" value={String(step.id)} />
      {state?.error ? (
        <div className="app-alert-error sm:col-span-2 text-xs" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-step_type`} required>
          Step type
        </FieldLabel>
        <select
          id={`${sid}-step_type`}
          name="humor_flavor_step_type_id"
          required
          defaultValue={step.humor_flavor_step_type_id}
          className="app-select"
        >
          {stepTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-model`} required>
          LLM model
        </FieldLabel>
        <select
          id={`${sid}-model`}
          name="llm_model_id"
          required
          defaultValue={step.llm_model_id}
          className="app-select"
        >
          {models.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-temp`}>LLM temperature</FieldLabel>
        <input
          id={`${sid}-temp`}
          name="llm_temperature"
          type="number"
          step="any"
          defaultValue={step.llm_temperature ?? ""}
          className="app-input"
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${sid}-in`} required>
          Input type
        </FieldLabel>
        <select
          id={`${sid}-in`}
          name="llm_input_type_id"
          required
          defaultValue={step.llm_input_type_id}
          className="app-select"
        >
          {inputTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor={`${sid}-out`} required>
          Output type
        </FieldLabel>
        <select
          id={`${sid}-out`}
          name="llm_output_type_id"
          required
          defaultValue={step.llm_output_type_id}
          className="app-select"
        >
          {outputTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
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
        <FieldLabel htmlFor={`${sid}-sys`}>System prompt</FieldLabel>
        <textarea
          id={`${sid}-sys`}
          name="llm_system_prompt"
          rows={2}
          defaultValue={step.llm_system_prompt ?? ""}
          className="app-input min-h-[4rem]"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${sid}-user`}>User prompt</FieldLabel>
        <textarea
          id={`${sid}-user`}
          name="llm_user_prompt"
          rows={2}
          defaultValue={step.llm_user_prompt ?? ""}
          className="app-input min-h-[4rem]"
        />
      </div>

      <div className="sm:col-span-2 pt-1">
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Saving…" : "Save step"}
        </button>
      </div>
    </form>
  );
}
