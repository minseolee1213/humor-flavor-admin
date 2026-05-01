import Link from "next/link";

import { FlavorPipelineBadge } from "@/components/humor-flavors/flavor-pipeline-badge";
import { computeFlavorStepBadgeState } from "@/lib/humor-flavor-steps/step-complete";
import type { HumorFlavorStepRow } from "@/lib/humor-flavor-steps/types";
import { createClient } from "@/lib/supabase/server";
import type { HumorFlavorRow } from "@/lib/humor-flavors/types";

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

export default async function HumorFlavorsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listError =
    typeof params.error === "string" ? params.error : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("humor_flavors")
    .select(
      "id, slug, description, created_datetime_utc, modified_datetime_utc",
    )
    .order("slug", { ascending: true });

  if (error) {
    return (
      <div className="app-page">
        <h1 className="app-h1">Humor flavors</h1>
        <p className="app-alert-error mt-6" role="alert">
          Could not load humor flavors. {error.message}
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as Pick<
    HumorFlavorRow,
    | "id"
    | "slug"
    | "description"
    | "created_datetime_utc"
    | "modified_datetime_utc"
  >[];

  const flavorIds = rows.map((r) => r.id);
  const { data: stepRows } =
    flavorIds.length > 0
      ? await supabase
          .from("humor_flavor_steps")
          .select(
            "humor_flavor_id, order_by, llm_system_prompt, llm_user_prompt, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id",
          )
          .in("humor_flavor_id", flavorIds)
      : { data: [] };

  const stepsByFlavor = new Map<number, HumorFlavorStepRow[]>();
  for (const s of stepRows ?? []) {
    const fid = s.humor_flavor_id as number;
    const list = stepsByFlavor.get(fid) ?? [];
    list.push(s as HumorFlavorStepRow);
    stepsByFlavor.set(fid, list);
  }

  return (
    <div className="app-page">
      <div className="flex flex-col gap-8 border-b border-zinc-200 pb-12 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-4">
          <p className="app-eyebrow">Configuration</p>
          <h1 className="app-h1">Humor flavors</h1>
          <p className="app-lead max-w-xl text-base">
            Manage flavors, prompt chains, caption testing, and related
            configuration. Select a row to open the detail workspace.
          </p>
        </div>
        <Link href="/admin/humor-flavors/new" className="app-btn-primary shrink-0">
          New flavor
        </Link>
      </div>

      {listError ? (
        <p className="app-alert-error mt-8" role="alert">
          {listError === "invalid_id"
            ? "Delete failed: invalid id."
            : listError}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="app-card mt-10">
          <div className="px-8 py-16 text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              No humor flavors yet
            </p>
            <p className="app-lead mt-2">
              Create your first flavor to start configuring prompt chains.
            </p>
            <Link
              href="/admin/humor-flavors/new"
              className="app-btn-primary mt-8 inline-flex"
            >
              Create flavor
            </Link>
          </div>
        </div>
      ) : (
        <div className="app-table-wrap mt-12">
          <table className="app-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th className="hidden sm:table-cell">Pipeline</th>
                <th className="hidden md:table-cell">Description</th>
                <th>Updated (UTC)</th>
                <th className="text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/humor-flavors/${row.id}`}
                        className="app-link-table"
                      >
                        {row.slug}
                      </Link>
                      <span className="sm:hidden">
                        <FlavorPipelineBadge
                          state={computeFlavorStepBadgeState(
                            stepsByFlavor.get(row.id) ?? [],
                          )}
                        />
                      </span>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <FlavorPipelineBadge
                      state={computeFlavorStepBadgeState(
                        stepsByFlavor.get(row.id) ?? [],
                      )}
                    />
                  </td>
                  <td className="hidden max-w-md md:table-cell">
                    {row.description ? (
                      <span className="line-clamp-2 text-zinc-600 dark:text-zinc-300">
                        {row.description}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic dark:text-zinc-400">
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {formatWhen(row.modified_datetime_utc)}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/humor-flavors/${row.id}/edit`}
                      className="app-btn-ghost text-xs"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
