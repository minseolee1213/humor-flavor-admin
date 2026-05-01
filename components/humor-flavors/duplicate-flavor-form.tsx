"use client";

import { useActionState, useState } from "react";

import {
  duplicateHumorFlavor,
  type ActionState,
} from "@/app/admin/humor-flavors/actions";

type Props = {
  sourceId: string;
  sourceSlug: string;
  sourceDescription: string | null;
};

export function DuplicateFlavorForm({
  sourceId,
  sourceSlug,
  sourceDescription,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    duplicateHumorFlavor,
    null,
  );

  return (
    <>
      <button
        type="button"
        className="app-btn-secondary"
        onClick={() => setOpen(true)}
      >
        Duplicate
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="app-card-static w-full max-w-xl">
            <div className="app-card-inner">
              <h2 className="app-h2">Duplicate humor flavor</h2>
              <p className="app-lead mt-2">
                Copy <span className="app-kbd">{sourceSlug}</span> and all of
                its prompt steps into a new flavor.
              </p>
            </div>
            <form
              action={formAction}
              className="space-y-4 p-5 sm:p-6"
              onSubmit={(e) => {
                if (
                  !confirm(
                    `Duplicate "${sourceSlug}" and all its prompt steps into the new flavor?`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="source_id" value={sourceId} />
              {state?.error ? (
                <p className="app-alert-error" role="alert">
                  {state.error}
                </p>
              ) : null}
              <div className="space-y-2">
                <label
                  htmlFor="duplicate-slug"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-300"
                >
                  New slug <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="duplicate-slug"
                  name="slug"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={`${sourceSlug}-copy`}
                  className="app-input"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="duplicate-description"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-300"
                >
                  Description (optional)
                </label>
                <textarea
                  id="duplicate-description"
                  name="description"
                  rows={4}
                  defaultValue={sourceDescription ?? ""}
                  className="app-input min-h-[6rem]"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="app-btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button type="submit" className="app-btn-primary" disabled={pending}>
                  {pending ? "Duplicating…" : "Duplicate flavor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
