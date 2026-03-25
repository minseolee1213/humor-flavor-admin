"use client";

import { useActionState } from "react";

import {
  createHumorFlavorStep,
  type StepActionState,
} from "@/lib/humor-flavor-steps/actions";
import type { LookupOption } from "@/lib/humor-flavor-steps/types";

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
  inputTypes: LookupOption[];
  outputTypes: LookupOption[];
  models: LookupOption[];
  stepTypes: LookupOption[];
};

export function AddHumorFlavorStepForm({
  humorFlavorId,
  inputTypes,
  outputTypes,
  models,
  stepTypes,
}: Props) {
  const [state, formAction, pending] = useActionState<
    StepActionState,
    FormData
  >(createHumorFlavorStep, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />
      {state?.error ? (
        <div className="app-alert-error sm:col-span-2" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-step_type" required>
          Step type
        </FieldLabel>
        <select
          id="add-step_type"
          name="humor_flavor_step_type_id"
          required
          className="app-select"
          defaultValue=""
        >
          <option value="" disabled>
            Select…
          </option>
          {stepTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="add-llm_model" required>
          LLM model
        </FieldLabel>
        <select
          id="add-llm_model"
          name="llm_model_id"
          required
          className="app-select"
          defaultValue=""
        >
          <option value="" disabled>
            Select…
          </option>
          {models.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="add-temp">LLM temperature</FieldLabel>
        <input
          id="add-temp"
          name="llm_temperature"
          type="number"
          step="any"
          className="app-input"
          placeholder="Optional"
        />
      </div>

      <div>
        <FieldLabel htmlFor="add-in" required>
          Input type
        </FieldLabel>
        <select
          id="add-in"
          name="llm_input_type_id"
          required
          className="app-select"
          defaultValue=""
        >
          <option value="" disabled>
            Select…
          </option>
          {inputTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="add-out" required>
          Output type
        </FieldLabel>
        <select
          id="add-out"
          name="llm_output_type_id"
          required
          className="app-select"
          defaultValue=""
        >
          <option value="" disabled>
            Select…
          </option>
          {outputTypes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-desc">Description</FieldLabel>
        <input
          id="add-desc"
          name="description"
          type="text"
          className="app-input"
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-sys">System prompt</FieldLabel>
        <textarea
          id="add-sys"
          name="llm_system_prompt"
          rows={3}
          className="app-input min-h-[5rem]"
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-user">User prompt</FieldLabel>
        <textarea
          id="add-user"
          name="llm_user_prompt"
          rows={3}
          className="app-input min-h-[5rem]"
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2 pt-1">
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Adding…" : "Add step to chain"}
        </button>
      </div>
    </form>
  );
}
