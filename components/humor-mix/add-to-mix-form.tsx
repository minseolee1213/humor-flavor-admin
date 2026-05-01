"use client";

import { addHumorFlavorToMix } from "@/app/admin/humor-mix/actions";

type EligibleFlavor = { id: number; slug: string };

export function AddToMixForm({ flavors }: { flavors: EligibleFlavor[] }) {
  return (
    <form action={addHumorFlavorToMix} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[14rem] flex-1">
        <label
          htmlFor="mix-flavor"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-300"
        >
          Add flavor to mix
        </label>
        <select
          id="mix-flavor"
          name="humor_flavor_id"
          required
          className="app-select w-full"
          defaultValue=""
        >
          <option value="" disabled>
            {flavors.length === 0
              ? "No eligible flavors (complete all steps first)"
              : "Select flavor…"}
          </option>
          {flavors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.slug} (id {f.id})
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="app-btn-primary"
        disabled={flavors.length === 0}
      >
        Add to mix
      </button>
    </form>
  );
}
