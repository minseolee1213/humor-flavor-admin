"use client";

import { useActionState, useRef } from "react";

import {
  copyHumorFlavorStepsFromSource,
  type CopyFlavorStepsState,
} from "@/lib/humor-flavor-steps/actions";

type SourceOption = { id: number; slug: string };

type Props = {
  targetFlavorId: string;
  targetSlug: string;
  sources: SourceOption[];
  targetHasSteps: boolean;
};

export function CopyStepsFromFlavorForm({
  targetFlavorId,
  targetSlug,
  sources,
  targetHasSteps,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const initial: CopyFlavorStepsState = null;
  const [state, formAction, pending] = useActionState(
    copyHumorFlavorStepsFromSource,
    initial,
  );

  return (
    <section className="app-card-static overflow-hidden">
      <div className="app-card-inner border-b border-zinc-200/80 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Copy steps from known-working flavor
        </h2>
        <p className="app-lead mt-1">
          Copy the exact step structure from a flavor that already generated
          captions. The source flavor is not modified; new rows are inserted only for{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {targetSlug}
          </span>
          .
        </p>
      </div>
      <div className="p-5 sm:p-6">
        {sources.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No other flavors have a complete prompt chain to copy from yet.
          </p>
        ) : (
          <form
            ref={formRef}
            action={formAction}
            className="space-y-4"
            onSubmit={(e) => {
              const form = formRef.current;
              if (!form) {
                return;
              }
              const fd = new FormData(form);
              const src = String(fd.get("source_flavor_id") ?? "");
              const opt = sources.find((s) => String(s.id) === src);
              const msg = opt
                ? `Copy all ${opt.slug} prompt steps into “${targetSlug}”? The source flavor will stay unchanged.`
                : `Copy prompt steps into “${targetSlug}”? The source flavor will stay unchanged.`;
              if (!confirm(msg)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="target_flavor_id" value={targetFlavorId} />
            {state?.error ? (
              <p className="app-alert-error" role="alert">
                {state.error}
              </p>
            ) : null}
            <div>
              <label
                htmlFor="copy-source-flavor"
                className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-300"
              >
                Source flavor (complete chain + generated captions)
              </label>
              <select
                id="copy-source-flavor"
                name="source_flavor_id"
                required
                className="app-select"
                defaultValue=""
              >
                <option value="" disabled>
                  Select source…
                </option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slug} (id {s.id})
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="acknowledge"
                value="on"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-red-600"
              />
              <span>
                I confirm I want to insert copied steps for this flavor only. I
                understand the source flavor will not be changed, and IDs/model
                combos will be copied exactly.
              </span>
            </label>
            {targetHasSteps ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This flavor already has steps. To preserve row history (no deletes),
                copy is only allowed into flavors with no steps.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending || targetHasSteps}
              className="app-btn-secondary disabled:pointer-events-none disabled:opacity-45"
            >
              {pending ? "Copying…" : "Copy steps"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
