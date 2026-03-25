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
      <div className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Humor flavor</h1>
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          Could not load this flavor. {error.message}
        </p>
        <Link
          href="/admin/humor-flavors"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/humor-flavors"
            className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to list
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {flavor.slug}
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-500">
            id: {idStr}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/humor-flavors/${idStr}/edit`}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <DeleteFlavorForm flavorId={idStr} />
        </div>
      </div>

      <dl className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Description
          </dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {flavor.description ?? (
              <span className="text-zinc-400 italic dark:text-zinc-500">
                None
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Created (UTC)
          </dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {formatWhen(flavor.created_datetime_utc)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Last modified (UTC)
          </dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {formatWhen(flavor.modified_datetime_utc)}
          </dd>
        </div>
      </dl>

      {stepError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
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
