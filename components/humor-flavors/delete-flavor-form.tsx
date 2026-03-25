"use client";

import { deleteHumorFlavor } from "@/app/admin/humor-flavors/actions";

type Props = {
  flavorId: string;
};

export function DeleteFlavorForm({ flavorId }: Props) {
  return (
    <form
      action={deleteHumorFlavor}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this humor flavor? This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={flavorId} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}
