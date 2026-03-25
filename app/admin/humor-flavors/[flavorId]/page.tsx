import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteFlavorForm } from "@/components/humor-flavors/delete-flavor-form";
import { FlavorCaptionTestPanel } from "@/components/humor-flavors/flavor-caption-test-panel";
import { RecentCaptionsForFlavor } from "@/components/humor-flavors/recent-captions-for-flavor";
import { HumorFlavorStepsPanel } from "@/components/humor-flavor-steps/steps-panel";
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

  return (
    <div className="app-page space-y-12">
      {/* Hero strip */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-100 via-white to-zinc-100 p-6 shadow-xl shadow-black/5 dark:border-white/[0.07] dark:from-zinc-900 dark:via-[#121214] dark:to-black dark:shadow-black/50 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl dark:bg-red-500/15"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/admin/humor-flavors"
              className="app-link-back inline-flex items-center gap-1"
            >
              <span aria-hidden>←</span> Humor flavors
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {flavor.slug}
            </h1>
            <p className="mt-2 font-mono text-xs text-zinc-500 dark:text-zinc-500">
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
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Description
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {flavor.description ?? (
                <span className="text-zinc-400 italic dark:text-zinc-500">
                  None
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Created (UTC)
            </dt>
            <dd className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
              {formatWhen(flavor.created_datetime_utc)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Last modified (UTC)
            </dt>
            <dd className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
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

      <HumorFlavorStepsPanel humorFlavorId={idStr} flavorSlug={flavor.slug} />

      <FlavorCaptionTestPanel
        humorFlavorId={idStr}
        flavorSlug={flavor.slug}
        studySets={studySets}
        recentImages={recentImages}
      />

      <RecentCaptionsForFlavor humorFlavorId={idStr} />
    </div>
  );
}
