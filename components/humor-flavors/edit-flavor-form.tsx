"use client";

import { useActionState } from "react";

import {
  type ActionState,
  updateHumorFlavor,
} from "@/app/admin/humor-flavors/actions";
import type { HumorFlavorRow } from "@/lib/humor-flavors/types";

type Props = {
  flavor: HumorFlavorRow;
};

export function EditFlavorForm({ flavor }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionState,
    FormData
  >(updateHumorFlavor, null);

  const idStr = String(flavor.id);

  return (
    <form
      action={formAction}
      className="app-card-static max-w-lg space-y-5 p-6 sm:p-8"
    >
      <input type="hidden" name="id" value={idStr} />
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
          defaultValue={flavor.slug}
          autoComplete="off"
          className="app-input"
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
          defaultValue={flavor.description ?? ""}
          className="app-input min-h-[6rem]"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
