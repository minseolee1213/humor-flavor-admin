"use client";

import { deleteHumorFlavorStep } from "@/lib/humor-flavor-steps/actions";

type Props = {
  humorFlavorId: string;
  stepId: string;
};

export function DeleteHumorFlavorStepForm({
  humorFlavorId,
  stepId,
}: Props) {
  return (
    <form
      action={deleteHumorFlavorStep}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this step from the chain? This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />
      <input type="hidden" name="step_id" value={stepId} />
      <button
        type="submit"
        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
      >
        Delete
      </button>
    </form>
  );
}
