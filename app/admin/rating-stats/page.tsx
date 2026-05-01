import { createClient } from "@/lib/supabase/server";

type VoteRow = {
  caption_id: string;
  vote_value: number;
  created_datetime_utc: string;
};

type CaptionRow = {
  id: string;
  content: string | null;
  image_id: string;
  created_datetime_utc: string;
};

type CaptionAggregate = {
  captionId: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  netScore: number;
  lastVoteAt: string | null;
};

const LOOKBACK_DAYS = 90;
const PAGE_SIZE = 1000;
const MAX_VOTES_TO_SCAN = 20000;

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function truncateText(value: string | null, max = 120): string {
  const text = (value ?? "").trim();
  if (text.length <= max) return text || "—";
  return `${text.slice(0, max - 1)}…`;
}

function buildBarWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) return "0%";
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
  return `${pct.toFixed(1)}%`;
}

async function countVotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sinceIso: string,
  voteValue?: 1 | -1,
): Promise<number> {
  let query = supabase
    .from("caption_votes")
    .select("id", { count: "exact", head: true })
    .gte("created_datetime_utc", sinceIso);
  if (voteValue != null) {
    query = query.eq("vote_value", voteValue);
  }
  const { count } = await query;
  return count ?? 0;
}

async function loadVotesForWindow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sinceIso: string,
): Promise<{ rows: VoteRow[]; truncated: boolean }> {
  const rows: VoteRow[] = [];
  let page = 0;
  while (rows.length < MAX_VOTES_TO_SCAN) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("caption_votes")
      .select("caption_id, vote_value, created_datetime_utc")
      .gte("created_datetime_utc", sinceIso)
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error || !data || data.length === 0) break;
    rows.push(...(data as VoteRow[]));
    if (data.length < PAGE_SIZE) break;
    page += 1;
  }
  return { rows, truncated: rows.length >= MAX_VOTES_TO_SCAN };
}

function aggregateVotes(votes: VoteRow[]): Map<string, CaptionAggregate> {
  const map = new Map<string, CaptionAggregate>();
  for (const vote of votes) {
    const key = vote.caption_id;
    const agg = map.get(key) ?? {
      captionId: key,
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      netScore: 0,
      lastVoteAt: vote.created_datetime_utc ?? null,
    };
    if (vote.vote_value === 1) agg.upvotes += 1;
    if (vote.vote_value === -1) agg.downvotes += 1;
    agg.totalVotes += 1;
    agg.netScore = agg.upvotes - agg.downvotes;
    if (!agg.lastVoteAt || vote.created_datetime_utc > agg.lastVoteAt) {
      agg.lastVoteAt = vote.created_datetime_utc;
    }
    map.set(key, agg);
  }
  return map;
}

export const dynamic = "force-dynamic";

export default async function RatingStatsPage() {
  const supabase = await createClient();
  const now = new Date();
  const sinceDate = new Date(
    now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );
  const sinceIso = sinceDate.toISOString();

  const [totalVotes, upvotes, downvotes, voteWindow] = await Promise.all([
    countVotes(supabase, sinceIso),
    countVotes(supabase, sinceIso, 1),
    countVotes(supabase, sinceIso, -1),
    loadVotesForWindow(supabase, sinceIso),
  ]);

  const aggregates = aggregateVotes(voteWindow.rows);
  const ratedCaptionCount = aggregates.size;
  const averageVotesPerCaption =
    ratedCaptionCount > 0 ? totalVotes / ratedCaptionCount : 0;
  const upvoteRate = totalVotes > 0 ? (upvotes / totalVotes) * 100 : 0;

  const allAggs = [...aggregates.values()];
  const topByNet = [...allAggs]
    .sort(
      (a, b) =>
        b.netScore - a.netScore ||
        b.totalVotes - a.totalVotes ||
        a.captionId.localeCompare(b.captionId),
    )
    .slice(0, 10);
  const mostRated = [...allAggs]
    .sort(
      (a, b) =>
        b.totalVotes - a.totalVotes ||
        b.netScore - a.netScore ||
        a.captionId.localeCompare(b.captionId),
    )
    .slice(0, 10);
  const lowestByNet = [...allAggs]
    .sort(
      (a, b) =>
        a.netScore - b.netScore ||
        b.totalVotes - a.totalVotes ||
        a.captionId.localeCompare(b.captionId),
    )
    .slice(0, 10);

  const captionIdsNeeded = [...new Set([...topByNet, ...mostRated, ...lowestByNet].map((a) => a.captionId))];
  const captionsById = new Map<string, CaptionRow>();
  if (captionIdsNeeded.length > 0) {
    const { data: captionRows } = await supabase
      .from("captions")
      .select("id, content, image_id, created_datetime_utc")
      .in("id", captionIdsNeeded);
    for (const row of (captionRows ?? []) as CaptionRow[]) {
      captionsById.set(row.id, row);
    }
  }

  const maxBar = Math.max(upvotes, downvotes, 1);

  return (
    <div className="app-page space-y-10">
      <section className="max-w-4xl space-y-4">
        <p className="app-eyebrow">Analytics</p>
        <h1 className="app-h1">Rating Statistics</h1>
        <p className="app-lead">
          Caption voting stats for the last {LOOKBACK_DAYS} days. Uses{" "}
          <code>caption_votes</code> as source of truth and joins caption details
          from <code>captions</code>.
        </p>
      </section>

      {voteWindow.truncated ? (
        <p className="rounded-xl border border-amber-400/35 bg-amber-100/60 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-200">
          Large dataset detected. Per-caption tables are computed from the most
          recent {formatCount(MAX_VOTES_TO_SCAN)} votes in this {LOOKBACK_DAYS}
          -day window to keep load bounded.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total votes</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{formatCount(totalVotes)}</p>
        </article>
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total rated captions</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{formatCount(ratedCaptionCount)}</p>
        </article>
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Upvotes</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatCount(upvotes)}</p>
        </article>
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Downvotes</p>
          <p className="mt-2 text-3xl font-bold text-rose-700 dark:text-rose-300">{formatCount(downvotes)}</p>
        </article>
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Upvote rate</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{formatPercent(upvoteRate)}</p>
        </article>
        <article className="app-card-static p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Avg votes per rated caption</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{averageVotesPerCaption.toFixed(2)}</p>
        </article>
      </section>

      <section className="app-card-static p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Vote distribution</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Simple bar comparison between upvotes and downvotes in the selected time window.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-200">Upvotes</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">{formatCount(upvotes)}</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-3 rounded-full bg-emerald-500" style={{ width: buildBarWidth(upvotes, maxBar) }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-200">Downvotes</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">{formatCount(downvotes)}</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-3 rounded-full bg-rose-500" style={{ width: buildBarWidth(downvotes, maxBar) }} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {[
          {
            title: "Top 10 captions by net score",
            description: "Highest net score first (upvotes - downvotes).",
            rows: topByNet,
          },
          {
            title: "Most rated captions",
            description: "Captions with the most total votes.",
            rows: mostRated,
          },
          {
            title: "Lowest scoring captions",
            description: "Lowest net score first (most downvote-heavy).",
            rows: lowestByNet,
          },
        ].map((table) => (
          <article key={table.title} className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{table.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{table.description}</p>
            </div>
            <div className="app-table-wrap">
              <table className="app-table text-sm">
                <thead>
                  <tr>
                    <th>Caption</th>
                    <th>Caption ID</th>
                    <th>Image ID</th>
                    <th>Created</th>
                    <th>Up</th>
                    <th>Down</th>
                    <th>Total</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-zinc-500 dark:text-zinc-400">
                        No votes found in this window.
                      </td>
                    </tr>
                  ) : (
                    table.rows.map((row) => {
                      const caption = captionsById.get(row.captionId);
                      return (
                        <tr key={`${table.title}-${row.captionId}`}>
                          <td className="max-w-[24rem]">{truncateText(caption?.content ?? null)}</td>
                          <td className="font-mono text-xs">{row.captionId}</td>
                          <td className="font-mono text-xs">{caption?.image_id ?? "—"}</td>
                          <td>{formatWhen(caption?.created_datetime_utc)}</td>
                          <td>{formatCount(row.upvotes)}</td>
                          <td>{formatCount(row.downvotes)}</td>
                          <td>{formatCount(row.totalVotes)}</td>
                          <td>{row.netScore}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
