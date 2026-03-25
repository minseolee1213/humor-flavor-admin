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
      <button type="submit" className="app-btn-danger">
        Delete flavor
      </button>
    </form>
  );
}
