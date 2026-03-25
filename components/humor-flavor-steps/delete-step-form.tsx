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
      <button type="submit" className="app-btn-danger px-2 py-1 text-xs">
        Delete
      </button>
    </form>
  );
}
