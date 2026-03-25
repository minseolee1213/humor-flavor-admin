"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  runHumorFlavorCaptionTest,
  type TestHumorFlavorState,
} from "@/lib/caption-test/actions";

export type ImageOption = {
  id: string;
  label: string;
  /** Storage URL from `images.url`, for preview */
  url: string | null;
};

export type StudySetOption = {
  setId: number;
  slug: string;
  images: ImageOption[];
};

type Props = {
  humorFlavorId: string;
  flavorSlug: string;
  studySets: StudySetOption[];
  recentImages: ImageOption[];
};

function SelectedImagePreview({
  url,
  imageId,
  flavorSlug,
  humorFlavorId,
}: {
  url: string | null;
  imageId: string;
  flavorSlug: string;
  humorFlavorId: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-emerald-900/20 bg-white/80 p-3 sm:flex-row sm:items-stretch dark:border-emerald-800/40 dark:bg-emerald-950/40">
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 sm:h-auto sm:w-36 sm:min-h-[7rem] dark:border-zinc-700 dark:bg-zinc-800">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote storage URLs; avoid next/image domain config
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
            No preview URL
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {flavorSlug}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Flavor id{" "}
          <span className="font-mono text-zinc-600 dark:text-zinc-300">
            {humorFlavorId}
          </span>
        </p>
        <p className="mt-2 break-all font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
          {imageId}
        </p>
      </div>
    </div>
  );
}

function stringifyApi(value: unknown, max = 12_000): string {
  try {
    const s = JSON.stringify(value, null, 2);
    return s.length > max ? `${s.slice(0, max)}\n…(truncated)` : s;
  } catch {
    return String(value);
  }
}

export function FlavorCaptionTestPanel({
  humorFlavorId,
  flavorSlug,
  studySets,
  recentImages,
}: Props) {
  const router = useRouter();
  const initial: TestHumorFlavorState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    runHumorFlavorCaptionTest,
    initial,
  );

  const [source, setSource] = useState<"study" | "recent">(
    studySets.some((s) => s.images.length > 0) ? "study" : "recent",
  );
  const [selectedSetId, setSelectedSetId] = useState<number | "">(
    studySets[0]?.setId ?? "",
  );
  /** Must match submitted `image_id`; keeps button disabled until a real image is chosen. */
  const [selectedImageId, setSelectedImageId] = useState("");

  const studyImages = useMemo(() => {
    const set = studySets.find((s) => s.setId === selectedSetId);
    return set?.images ?? [];
  }, [studySets, selectedSetId]);

  const availableImageIds = useMemo(() => {
    if (source === "study") return studyImages.map((i) => i.id);
    return recentImages.map((i) => i.id);
  }, [source, studyImages, recentImages]);

  useEffect(() => {
    setSelectedImageId((prev) =>
      prev && availableImageIds.includes(prev) ? prev : "",
    );
  }, [availableImageIds]);

  const canGenerate =
    selectedImageId.length > 0 && availableImageIds.includes(selectedImageId);

  const selectedImageMeta = useMemo(() => {
    const list = source === "study" ? studyImages : recentImages;
    return list.find((i) => i.id === selectedImageId) ?? null;
  }, [source, studyImages, recentImages, selectedImageId]);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <section className="rounded-lg border border-emerald-900/20 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/25">
      <div className="border-b border-emerald-900/15 px-4 py-3 dark:border-emerald-800/30">
        <h2 className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
          Test this humor flavor
        </h2>
        <p className="mt-1 text-sm text-emerald-900/85 dark:text-emerald-200/85">
          Sends{" "}
          <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/60">
            POST …/pipeline/generate-captions
          </code>{" "}
          with{" "}
          <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/60">
            imageId
          </code>{" "}
          +{" "}
          <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/60">
            humorFlavorId
          </code>{" "}
          (server-side only). Uses your Supabase session JWT as{" "}
          <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/60">
            Authorization: Bearer …
          </code>
          . Results below include the raw API response and rows read back from{" "}
          <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/60">
            captions
          </code>{" "}
          (RLS applies).
        </p>
      </div>

      <div className="p-4">
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Image source
            </legend>
            <label className="mr-4 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="source_dummy"
                checked={source === "study"}
                onChange={() => setSource("study")}
              />
              Study image set
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="source_dummy"
                checked={source === "recent"}
                onChange={() => setSource("recent")}
              />
              Recent images
            </label>
          </fieldset>

          {source === "study" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="study-set"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Set
                </label>
                <select
                  id="study-set"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  value={selectedSetId === "" ? "" : String(selectedSetId)}
                  onChange={(e) =>
                    setSelectedSetId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                >
                  {studySets.length === 0 ? (
                    <option value="">No study sets visible</option>
                  ) : (
                    studySets.map((s) => (
                      <option key={s.setId} value={s.setId}>
                        {s.slug} ({s.images.length} images)
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label
                  htmlFor="study-image"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Image
                </label>
                <select
                  id="study-image"
                  name="image_id"
                  required
                  value={selectedImageId}
                  onChange={(e) => setSelectedImageId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                >
                  <option value="">
                    {studyImages.length === 0
                      ? "No images in this set"
                      : "Select image…"}
                  </option>
                  {studyImages.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="recent-image"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Image
              </label>
              <select
                id="recent-image"
                name="image_id"
                required
                value={selectedImageId}
                onChange={(e) => setSelectedImageId(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              >
                <option value="">
                  {recentImages.length === 0
                    ? "No recent images"
                    : "Select image…"}
                </option>
                {recentImages.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !canGenerate}
            title={
              !canGenerate
                ? "Select an image from the list first."
                : undefined
            }
            className="rounded-lg border border-emerald-800 bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            {pending ? "Calling API…" : "Generate captions"}
          </button>
        </form>

        {selectedImageMeta ? (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/80 dark:text-emerald-200/80">
              {state.status === "success"
                ? "Image tested"
                : pending
                  ? "Image to test"
                  : "Selected image"}
            </p>
            <SelectedImagePreview
              url={selectedImageMeta.url}
              imageId={selectedImageMeta.id}
              flavorSlug={flavorSlug}
              humorFlavorId={humorFlavorId}
            />
          </div>
        ) : null}

        {state.status === "error" ? (
          <div
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
            role="alert"
          >
            <p className="font-medium">{state.message}</p>
            {state.detail ? (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs opacity-90">
                {state.detail}
              </pre>
            ) : null}
          </div>
        ) : null}

        {state.status === "success" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              API succeeded (HTTP {state.httpStatus}). Captions below may take a
              moment to appear in the database after the request completes.
            </p>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                API response body
              </h3>
              <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-zinc-200 bg-zinc-950/90 p-3 text-xs text-zinc-100 dark:border-zinc-700">
                {stringifyApi(state.apiResponse)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Captions for this flavor + selected image (DB)
              </h3>
              {state.captionsForImageAndFlavor.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  No matching rows yet. If the API writes asynchronously,
                  refresh the page.
                </p>
              ) : (
                <ul className="mt-1 space-y-2 border border-zinc-200 rounded-md p-2 dark:border-zinc-800">
                  {state.captionsForImageAndFlavor.map((c) => (
                    <li key={c.id} className="text-sm text-zinc-800 dark:text-zinc-200">
                      {c.content ?? (
                        <span className="italic text-zinc-400">(empty)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Latest captions for this flavor after request (DB)
              </h3>
              {state.recentCaptionsForFlavor.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  None returned from query.
                </p>
              ) : (
                <ul className="mt-1 space-y-2">
                  {state.recentCaptionsForFlavor.map((c) => (
                    <li
                      key={c.id}
                      className="rounded border border-zinc-100 bg-zinc-50/80 px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {c.content ?? "—"}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-zinc-500">
                        {c.image_id}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
