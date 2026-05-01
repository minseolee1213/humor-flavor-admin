import Link from "next/link";

import { AddToMixForm } from "@/components/humor-mix/add-to-mix-form";
import { RemoveMixRowForm } from "@/components/humor-mix/remove-mix-row-form";
import { isFlavorChainComplete } from "@/lib/humor-flavor-steps/step-complete";
import type { HumorFlavorStepRow } from "@/lib/humor-flavor-steps/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function HumorMixPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const errRaw = typeof sp.error === "string" ? sp.error : undefined;
  const flavorIdRaw =
    typeof sp.flavor_id === "string" ? sp.flavor_id : undefined;

  const supabase = await createClient();

  const [{ data: mixRows, error: mixErr }, { data: flavorRows, error: flavorErr }] =
    await Promise.all([
      supabase
        .from("humor_flavor_mix")
        .select(
          "id, humor_flavor_id, caption_count, modified_datetime_utc",
        )
        .order("humor_flavor_id", { ascending: true }),
      supabase.from("humor_flavors").select("id, slug").order("slug", {
        ascending: true,
      }),
    ]);

  if (mixErr || flavorErr) {
    return (
      <div className="app-page">
        <h1 className="app-h1">Humor flavor mix</h1>
        <p className="app-alert-error mt-6" role="alert">
          Could not load mix data.{" "}
          {mixErr?.message ?? flavorErr?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  const rows = mixRows ?? [];
  const flavors = flavorRows ?? [];
  const slugById = new Map(flavors.map((f) => [f.id, f.slug]));

  const allFlavorIds = flavors.map((f) => f.id);
  const mixFlavorIds = rows.map((r) => r.humor_flavor_id);

  let stepsByFlavorId = new Map<number, HumorFlavorStepRow[]>();
  if (allFlavorIds.length > 0) {
    const { data: stepRows } = await supabase
      .from("humor_flavor_steps")
      .select("*")
      .in("humor_flavor_id", allFlavorIds);
    for (const s of (stepRows ?? []) as HumorFlavorStepRow[]) {
      const fid = s.humor_flavor_id;
      const list = stepsByFlavorId.get(fid) ?? [];
      list.push(s);
      stepsByFlavorId.set(fid, list);
    }
  }

  const inMix = new Set(mixFlavorIds);
  const eligibleForAdd = flavors.filter((f) => {
    if (inMix.has(f.id)) {
      return false;
    }
    const steps = stepsByFlavorId.get(f.id) ?? [];
    return isFlavorChainComplete(steps);
  });

  const mixRowsIncomplete = rows.filter((r) => {
    const steps = stepsByFlavorId.get(r.humor_flavor_id) ?? [];
    return !isFlavorChainComplete(steps);
  });

  let errorMessage: string | undefined;
  if (errRaw === "invalid_flavor") {
    errorMessage = "Choose a valid flavor.";
  } else if (errRaw === "invalid_id") {
    errorMessage = "Invalid mix row id.";
  } else if (errRaw === "incomplete_steps") {
    errorMessage =
      flavorIdRaw != null
        ? `Flavor ${flavorIdRaw} cannot be added: prompt chain is incomplete (need at least one step with system and user prompts, and all required fields).`
        : "That flavor’s prompt chain is incomplete. Finish all steps before adding to the mix.";
  } else if (errRaw === "already_in_mix") {
    errorMessage = "That flavor is already in the mix.";
  } else if (errRaw) {
    errorMessage = errRaw;
  }

  return (
    <div className="app-page space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="app-eyebrow">Configuration</p>
        <h1 className="app-h1">Humor flavor mix</h1>
        <p className="app-lead max-w-2xl text-base">
          Flavors in the mix are eligible for assignment workflows. Only flavors
          with a complete prompt chain (every step has system and user prompts and
          required IDs) can be added.
        </p>
      </div>

      {errorMessage ? (
        <p className="app-alert-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {mixRowsIncomplete.length > 0 ? (
        <section
          className="app-card-static border-amber-500/25 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-950/20"
          aria-label="Mix entries with incomplete prompt chains"
        >
          <div className="app-card-inner">
            <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">
              Incomplete prompt chains in mix
            </h2>
            <p className="app-lead mt-2 text-amber-900/90 dark:text-amber-100/90">
              These flavors are still listed in the mix but their steps are not
              pipeline-complete. Fix prompts on the flavor detail page before
              relying on them.
            </p>
            <ul className="mt-4 list-inside list-disc text-sm text-amber-950 dark:text-amber-50">
              {mixRowsIncomplete.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/humor-flavors/${r.humor_flavor_id}`}
                    className="app-link-table underline-offset-2 hover:underline"
                  >
                    {slugById.get(r.humor_flavor_id) ?? "Unknown"} (id{" "}
                    {r.humor_flavor_id})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="app-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          Add flavor
        </h2>
        <p className="app-lead mt-1">
          Only flavors with a complete step chain appear in the list. Others must
          be fixed under{" "}
          <Link href="/admin/humor-flavors" className="app-link-back inline">
            Humor flavors
          </Link>
          .
        </p>
        <div className="mt-6">
          <AddToMixForm flavors={eligibleForAdd} />
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <div className="app-card-inner border-b border-zinc-200/80 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Current mix
          </h2>
          <p className="app-lead mt-1">
            {rows.length} flavor{rows.length === 1 ? "" : "s"} in mix.
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-300">
            No flavors in the mix yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="app-table min-w-[40rem]">
              <thead>
                <tr>
                  <th>Flavor</th>
                  <th>Humor flavor id</th>
                  <th>Captions</th>
                  <th>Updated (UTC)</th>
                  <th>Chain</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const steps = stepsByFlavorId.get(r.humor_flavor_id) ?? [];
                  const complete = isFlavorChainComplete(steps);
                  return (
                    <tr
                      key={r.id}
                      className={complete ? undefined : "app-table-row--warn"}
                    >
                      <td className="font-medium text-zinc-900 dark:text-zinc-100">
                        <Link
                          href={`/admin/humor-flavors/${r.humor_flavor_id}`}
                          className="app-link-table"
                        >
                          {slugById.get(r.humor_flavor_id) ?? "—"}
                        </Link>
                      </td>
                      <td className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {r.humor_flavor_id}
                      </td>
                      <td>{r.caption_count}</td>
                      <td className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                        {formatWhen(r.modified_datetime_utc)}
                      </td>
                      <td>
                        {complete ? (
                          <span className="text-sm text-emerald-700 dark:text-emerald-400">
                            Complete
                          </span>
                        ) : (
                          <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                            Incomplete
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <RemoveMixRowForm mixRowId={r.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
