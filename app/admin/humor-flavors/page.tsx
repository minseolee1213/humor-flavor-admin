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
      <div className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Humor flavors</h1>
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Humor flavors
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage flavors, steps, caption testing, and related configuration.
          </p>
        </div>
        <Link
          href="/admin/humor-flavors/new"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New flavor
        </Link>
      </div>

      {listError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {listError === "invalid_id"
            ? "Delete failed: invalid id."
            : listError}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            No humor flavors yet
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create one to get started.
          </p>
          <Link
            href="/admin/humor-flavors/new"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            New flavor
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  Slug
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  Updated (UTC)
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {" "}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white hover:bg-zinc-50/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/60"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    <Link
                      href={`/admin/humor-flavors/${row.id}`}
                      className="text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                    >
                      {row.slug}
                    </Link>
                  </td>
                  <td className="max-w-md px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.description ? (
                      <span className="line-clamp-2">{row.description}</span>
                    ) : (
                      <span className="text-zinc-400 italic dark:text-zinc-500">
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatWhen(row.modified_datetime_utc)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/humor-flavors/${row.id}/edit`}
                      className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
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
