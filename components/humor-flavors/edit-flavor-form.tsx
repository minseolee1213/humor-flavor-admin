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
    <form action={formAction} className="mx-auto max-w-lg space-y-4">
      <input type="hidden" name="id" value={idStr} />
      {state?.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="slug" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Slug <span className="text-red-600">*</span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          defaultValue={flavor.slug}
          autoComplete="off"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={flavor.description ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Optional"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
