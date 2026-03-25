import Link from "next/link";
import { notFound } from "next/navigation";

import { EditFlavorForm } from "@/components/humor-flavors/edit-flavor-form";
import { createClient } from "@/lib/supabase/server";
import type { HumorFlavorRow } from "@/lib/humor-flavors/types";

export const dynamic = "force-dynamic";

export default async function EditHumorFlavorPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;

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
        <h1 className="text-2xl font-semibold tracking-tight">Edit flavor</h1>
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/humor-flavors/${flavorId}`}
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to flavor
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Edit: {data.slug}
        </h1>
      </div>
      <EditFlavorForm flavor={data} />
    </div>
  );
}
