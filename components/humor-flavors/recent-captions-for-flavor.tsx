import { createClient } from "@/lib/supabase/server";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function RecentCaptionsForFlavor({
  humorFlavorId,
}: {
  humorFlavorId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("humor_flavor_id", humorFlavorId)
    .order("created_datetime_utc", { ascending: false })
    .limit(25);

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50/80 p-4 dark:border-red-900 dark:bg-red-950/30">
        <h2 className="font-semibold text-red-900 dark:text-red-100">
          Recent captions (this flavor)
        </h2>
        <p className="mt-2 text-sm text-red-800 dark:text-red-200">
          Could not load captions: {error.message}
        </p>
      </section>
    );
  }

  const rows = data ?? [];

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Recent captions (this flavor)
        </h2>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          Rows from <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">captions</code> where{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">humor_flavor_id</code> matches.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No captions stored for this flavor yet. Run a test above if your API
          writes to this table.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                {row.content ?? (
                  <span className="italic text-zinc-400">(empty content)</span>
                )}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                image_id {row.image_id} · {formatWhen(row.created_datetime_utc)}{" "}
                UTC
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
