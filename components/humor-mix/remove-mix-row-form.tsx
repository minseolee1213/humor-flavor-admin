"use client";

import { removeHumorFlavorFromMix } from "@/app/admin/humor-mix/actions";

export function RemoveMixRowForm({ mixRowId }: { mixRowId: number }) {
  return (
    <form
      action={removeHumorFlavorFromMix}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Remove this flavor from the mix?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={String(mixRowId)} />
      <button type="submit" className="app-btn-danger px-2 py-1 text-xs">
        Remove
      </button>
    </form>
  );
}
