import Link from "next/link";

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

  return (
    <div className="app-page">
      <div className="flex flex-col gap-6 border-b border-zinc-200 pb-10 dark:border-white/[0.06] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600/90 dark:text-red-500/90">
            Configuration
          </p>
          <h1 className="app-h1 mt-2">Humor flavors</h1>
          <p className="app-lead mt-3 max-w-xl">
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
        <div className="app-table-wrap mt-10 shadow-xl shadow-black/5 dark:shadow-black/40">
          <table className="app-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th className="hidden md:table-cell">Description</th>
                <th>Updated (UTC)</th>
                <th className="text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium text-zinc-900 dark:text-white">
                    <Link
                      href={`/admin/humor-flavors/${row.id}`}
                      className="hover:text-red-600 dark:hover:text-[var(--accent)]"
                    >
                      {row.slug}
                    </Link>
                  </td>
                  <td className="hidden max-w-md md:table-cell">
                    {row.description ? (
                      <span className="line-clamp-2 text-zinc-600 dark:text-zinc-400">
                        {row.description}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic dark:text-zinc-500">
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
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
