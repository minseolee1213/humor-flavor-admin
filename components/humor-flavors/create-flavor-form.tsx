"use client";

import { useActionState } from "react";

import {
  createHumorFlavor,
  type ActionState,
} from "@/app/admin/humor-flavors/actions";

export function CreateFlavorForm() {
  const [state, formAction, pending] = useActionState<
    ActionState,
    FormData
  >(createHumorFlavor, null);

  return (
    <form
      action={formAction}
      className="app-card-static max-w-lg space-y-5 p-6 sm:p-8"
    >
      {state?.error ? (
        <p className="app-alert-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-2">
        <label
          htmlFor="slug"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-300"
        >
          Slug <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          autoComplete="off"
          className="app-input"
          placeholder="e.g. deadpan-quip"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="app-input min-h-[6rem]"
          placeholder="Optional"
        />
      </div>
      <div className="pt-2">
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Creating…" : "Create flavor"}
        </button>
      </div>
    </form>
  );
}
