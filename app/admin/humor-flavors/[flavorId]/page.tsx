import Link from "next/link";
import { notFound } from "next/navigation";

import { CopiedStepsDiff } from "@/components/humor-flavors/copied-steps-diff";
import { CopyStepsFromFlavorForm } from "@/components/humor-flavors/copy-steps-from-flavor-form";
import { DeleteFlavorForm } from "@/components/humor-flavors/delete-flavor-form";
import { DuplicateFlavorForm } from "@/components/humor-flavors/duplicate-flavor-form";
import { FlavorCaptionTestPanel } from "@/components/humor-flavors/flavor-caption-test-panel";
import { RecentCaptionsForFlavor } from "@/components/humor-flavors/recent-captions-for-flavor";
import { HumorFlavorStepsPanel } from "@/components/humor-flavor-steps/steps-panel";
import { loadStepsForFlavor } from "@/lib/humor-flavor-steps/actions";
import { isFlavorChainComplete } from "@/lib/humor-flavor-steps/step-complete";
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

export default async function HumorFlavorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ flavorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { flavorId } = await params;
  const sp = await searchParams;
  const stepError =
    typeof sp.step_error === "string" ? sp.step_error : undefined;
  const duplicateState = typeof sp.dup === "string" ? sp.dup : undefined;
  const copiedState = sp.copied === "1";
  const copiedFromId =
    typeof sp.copied_from === "string" && /^\d+$/.test(sp.copied_from)
      ? sp.copied_from
      : undefined;

  if (!/^\d+$/.test(flavorId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("humor_flavors")
    .select("*")
    .eq("id", flavorId)
    .maybeSingle<HumorFlavorRow>();

  if (error) {
    return (
      <div className="app-page">
        <h1 className="app-h1">Humor flavor</h1>
        <p className="app-alert-error mt-6" role="alert">
          Could not load this flavor. {error.message}
        </p>
        <Link href="/admin/humor-flavors" className="app-link-back mt-6 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const flavor = data;
  const idStr = String(flavor.id);

  const [{ data: sets }, { data: mappings }, { data: recentImgs }] =
    await Promise.all([
      supabase.from("study_image_sets").select("id, slug").order("slug"),
      supabase
        .from("study_image_set_image_mappings")
        .select("study_image_set_id, image_id"),
      supabase
        .from("images")
        .select("id, url, image_description")
        .order("created_datetime_utc", { ascending: false })
        .limit(120),
    ]);

  const mapList = mappings ?? [];
  const imageIds = [...new Set(mapList.map((m) => m.image_id))];
  const studyImageRows =
    imageIds.length > 0
      ? (
          await supabase
            .from("images")
            .select("id, url, image_description")
            .in("id", imageIds)
        ).data ?? []
      : [];
  const imgById: Record<
    string,
    { url: string | null; image_description: string | null }
  > = Object.fromEntries(
    studyImageRows.map((im) => [
      im.id,
      { url: im.url, image_description: im.image_description },
    ]),
  );

  function shortImageLabel(imageId: string): string {
    const meta = imgById[imageId];
    const bit =
      meta?.image_description?.trim().slice(0, 56) ||
      meta?.url?.trim().slice(-52) ||
      imageId.slice(0, 8);
    return `${bit}… (${imageId.slice(0, 8)}…)`;
  }

  const studySets = (sets ?? []).map((set) => ({
    setId: set.id,
    slug: set.slug,
    images: mapList
      .filter((m) => m.study_image_set_id === set.id)
      .map((m) => ({
        id: m.image_id,
        label: shortImageLabel(m.image_id),
        url: imgById[m.image_id]?.url ?? null,
      })),
  }));

  const recentImages = (recentImgs ?? []).map((im) => ({
    id: im.id,
    label:
      (im.image_description?.trim().slice(0, 48) ||
        im.url?.trim().slice(-44) ||
        im.id.slice(0, 8)) + `… (${im.id.slice(0, 8)}…)`,
    url: im.url ?? null,
  }));

  const steps = await loadStepsForFlavor(supabase, idStr);
  const captionPipelineReady = isFlavorChainComplete(steps);

  const { data: allFlavors } = await supabase
    .from("humor_flavors")
    .select("id, slug")
    .order("slug");
  const flavorIdsForSteps = (allFlavors ?? []).map((f) => f.id);
  const { data: allStepRows } =
    flavorIdsForSteps.length > 0
      ? await supabase
          .from("humor_flavor_steps")
          .select("*")
          .in("humor_flavor_id", flavorIdsForSteps)
      : { data: [] as HumorFlavorStepRow[] };

  const stepsByFlavor = new Map<number, HumorFlavorStepRow[]>();
  for (const row of (allStepRows ?? []) as HumorFlavorStepRow[]) {
    const fid = row.humor_flavor_id;
    const list = stepsByFlavor.get(fid) ?? [];
    list.push(row);
    stepsByFlavor.set(fid, list);
  }

  const copySources = (allFlavors ?? [])
    .filter(
      (f) =>
        f.id !== flavor.id &&
        isFlavorChainComplete(stepsByFlavor.get(f.id) ?? []),
    )
    .map((f) => ({ id: f.id, slug: f.slug }));

  const successfulFlavorIds = new Set<number>();
  const { data: recentCaptionFlavorRows } = await supabase
    .from("captions")
    .select("humor_flavor_id")
    .not("humor_flavor_id", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(3000);
  for (const row of recentCaptionFlavorRows ?? []) {
    if (typeof row.humor_flavor_id === "number") {
      successfulFlavorIds.add(row.humor_flavor_id);
    }
  }
  const workingCopySources = copySources.filter((s) =>
    successfulFlavorIds.has(s.id),
  );

  let copiedFromSlug: string | undefined;
  let copiedFromSteps: HumorFlavorStepRow[] = [];
  if (copiedState && copiedFromId) {
    const src = (allFlavors ?? []).find((f) => String(f.id) === copiedFromId);
    copiedFromSlug = src?.slug;
    copiedFromSteps = await loadStepsForFlavor(supabase, copiedFromId);
  }

  return (
    <div className="app-page space-y-12">
      {/* Hero strip */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-100 via-white to-zinc-50 p-8 shadow-xl shadow-zinc-900/5 dark:border-zinc-800/90 dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-950 dark:to-black dark:shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] sm:p-10">
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-500/20 blur-3xl dark:bg-red-600/30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-rose-500/15 blur-3xl dark:bg-rose-600/20"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/admin/humor-flavors"
              className="app-link-back inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Humor flavors
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl lg:text-5xl">
              {flavor.slug}
            </h1>
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              id {idStr}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/humor-flavors/${idStr}/edit`}
              className="app-btn-secondary"
            >
              Edit flavor
            </Link>
            <DuplicateFlavorForm
              sourceId={idStr}
              sourceSlug={flavor.slug}
              sourceDescription={flavor.description ?? null}
            />
            <DeleteFlavorForm flavorId={idStr} />
          </div>
        </div>
      </section>

      {/* Metadata */}
      <section className="app-card">
        <div className="app-card-inner">
          <h2 className="app-h2">Flavor details</h2>
          <p className="app-lead mt-1">
            Core record for this humor flavor. Prompt chain and tests reference
            this id.
          </p>
        </div>
        <dl className="grid gap-6 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Description
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
              {flavor.description ?? (
                <span className="text-zinc-400 italic dark:text-zinc-400">
                  None
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Created (UTC)
            </dt>
            <dd className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">
              {formatWhen(flavor.created_datetime_utc)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Last modified (UTC)
            </dt>
            <dd className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">
              {formatWhen(flavor.modified_datetime_utc)}
            </dd>
          </div>
        </dl>
      </section>

      {stepError ? (
        <p className="app-alert-error" role="alert">
          Step action failed:{" "}
          {stepError === "invalid" ? "Invalid request." : stepError}
        </p>
      ) : null}

      {duplicateState === "success" ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-200"
          role="status"
        >
          Flavor duplicated successfully. Prompt steps were copied in order.
        </p>
      ) : null}

      {copiedState ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-200"
          role="status"
        >
          Steps copied from a known-working flavor. Keep type/model IDs as-is and
          only edit flavor-specific wording in prompts if needed.
        </p>
      ) : null}

      <CopyStepsFromFlavorForm
        targetFlavorId={idStr}
        targetSlug={flavor.slug}
        sources={workingCopySources}
        targetHasSteps={steps.length > 0}
      />

      {copiedState && copiedFromSlug ? (
        <CopiedStepsDiff
          sourceSlug={copiedFromSlug}
          targetSlug={flavor.slug}
          sourceSteps={copiedFromSteps}
          targetSteps={steps}
        />
      ) : null}

      <HumorFlavorStepsPanel humorFlavorId={idStr} flavorSlug={flavor.slug} />

      <FlavorCaptionTestPanel
        humorFlavorId={idStr}
        flavorSlug={flavor.slug}
        studySets={studySets}
        recentImages={recentImages}
        captionPipelineReady={captionPipelineReady}
        stepCount={steps.length}
      />

      <RecentCaptionsForFlavor humorFlavorId={idStr} />
    </div>
  );
}
