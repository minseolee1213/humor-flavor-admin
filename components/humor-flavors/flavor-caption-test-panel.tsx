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
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 shadow-lg shadow-black/30 sm:flex-row sm:items-stretch">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-auto sm:w-40 sm:min-h-[8rem]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote storage URLs; avoid next/image domain config
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-500">
            No preview URL
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-500/90">
          Preview
        </p>
        <p className="mt-1 font-semibold leading-snug text-white">
          {flavorSlug}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Flavor id{" "}
          <span className="font-mono text-zinc-300">{humorFlavorId}</span>
        </p>
        <p className="mt-3 break-all font-mono text-[11px] leading-snug text-zinc-400">
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

  const [routerReady, setRouterReady] = useState(false);
  useEffect(() => {
    setRouterReady(true);
  }, []);

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
    if (routerReady && state.status === "success") {
      router.refresh();
    }
  }, [state.status, router, routerReady]);

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-red-950/40 via-zinc-900/50 to-transparent px-5 py-4 dark:border-white/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/90">
          Caption pipeline
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Test this humor flavor
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Sends <span className="app-kbd">POST …/generate-captions</span> with{" "}
          <span className="app-kbd">imageId</span> +{" "}
          <span className="app-kbd">humorFlavorId</span> (server-side only). Auth
          via your Supabase session{" "}
          <span className="app-kbd">Authorization: Bearer …</span>. Response
          and DB rows from <span className="app-kbd">captions</span> (RLS).
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="humor_flavor_id" value={humorFlavorId} />

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-zinc-900 dark:text-white">
              Image source
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="source_dummy"
                  className="h-4 w-4 accent-red-600"
                  checked={source === "study"}
                  onChange={() => setSource("study")}
                />
                Study image set
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="source_dummy"
                  className="h-4 w-4 accent-red-600"
                  checked={source === "recent"}
                  onChange={() => setSource("recent")}
                />
                Recent images
              </label>
            </div>
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
                  className="app-select mt-1"
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
                  className="app-select mt-1"
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
                className="app-select mt-1"
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
            className="app-btn-primary disabled:pointer-events-none disabled:opacity-45"
          >
            {pending ? "Calling API…" : "Generate captions"}
          </button>
        </form>

        {selectedImageMeta ? (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-500/90">
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
          <div className="app-alert-error mt-6" role="alert">
            <p className="font-medium">{state.message}</p>
            {state.detail ? (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs opacity-90">
                {state.detail}
              </pre>
            ) : null}
          </div>
        ) : null}

        {state.status === "success" ? (
          <div className="mt-8 space-y-6 border-t border-zinc-200/80 pt-8 dark:border-white/[0.06]">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              API succeeded{" "}
              <span className="app-kbd">HTTP {state.httpStatus}</span>. Captions
              may appear in the database shortly after the request completes.
            </p>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                API response
              </h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed text-zinc-300">
                {stringifyApi(state.apiResponse)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Captions — selected image (DB)
              </h3>
              {state.captionsForImageAndFlavor.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  No matching rows yet. If the API writes asynchronously,
                  refresh the page.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {state.captionsForImageAndFlavor.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-200"
                    >
                      {c.content ?? (
                        <span className="italic text-zinc-500">(empty)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Latest captions — flavor (DB)
              </h3>
              {state.recentCaptionsForFlavor.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  None returned from query.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {state.recentCaptionsForFlavor.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 px-4 py-3 text-sm"
                    >
                      <span className="text-zinc-100">
                        {c.content ?? "—"}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-zinc-500">
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
