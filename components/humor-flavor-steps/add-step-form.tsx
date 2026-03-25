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
      className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
    >
      {children}
      {req ? <span className="text-red-600"> *</span> : null}
    </label>
  );
}

function inputClass(
  extra = "",
): string {
  return `w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 ${extra}`;
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
        <div
          className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
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
          className={inputClass()}
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
          className={inputClass()}
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
          className={inputClass()}
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
          className={inputClass()}
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
          className={inputClass()}
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
          className={inputClass()}
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-sys">System prompt</FieldLabel>
        <textarea
          id="add-sys"
          name="llm_system_prompt"
          rows={3}
          className={inputClass()}
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel htmlFor="add-user">User prompt</FieldLabel>
        <textarea
          id="add-user"
          name="llm_user_prompt"
          rows={3}
          className={inputClass()}
          placeholder="Optional"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add step to chain"}
        </button>
      </div>
    </form>
  );
}
