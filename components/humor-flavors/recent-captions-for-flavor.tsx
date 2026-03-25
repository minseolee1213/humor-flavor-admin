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
      <section className="app-card overflow-hidden border-red-500/20">
        <div className="app-card-inner border-red-500/10 bg-red-500/5">
          <h2 className="app-h2 text-red-800 dark:text-red-200">
            Recent captions (this flavor)
          </h2>
          <p className="app-lead mt-2 text-red-700 dark:text-red-300">
            Could not load captions: {error.message}
          </p>
        </div>
      </section>
    );
  }

  const rows = data ?? [];

  return (
    <section className="app-card overflow-hidden">
      <div className="app-card-inner">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          Recent captions
        </h2>
        <p className="app-lead mt-1">
          From <span className="app-kbd">captions</span> where{" "}
          <span className="app-kbd">humor_flavor_id</span> matches this flavor.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No captions stored for this flavor yet. Run a test above if your API
          writes to this table.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200/80 dark:divide-white/[0.06]">
          {rows.map((row) => (
            <li key={row.id} className="px-5 py-4 transition hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]">
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {row.content ?? (
                  <span className="italic text-zinc-400">(empty content)</span>
                )}
              </p>
              <p className="mt-2 font-mono text-xs text-zinc-500">
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
