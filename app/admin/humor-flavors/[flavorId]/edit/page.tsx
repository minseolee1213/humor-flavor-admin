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
      <div className="app-page">
        <h1 className="app-h1">Edit flavor</h1>
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

  return (
    <div className="app-page">
      <div className="max-w-lg">
        <Link
          href={`/admin/humor-flavors/${flavorId}`}
          className="app-link-back"
        >
          ← Back to flavor
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-600/90 dark:text-red-500/90">
          Edit
        </p>
        <h1 className="app-h1 mt-2">{data.slug}</h1>
      </div>
      <div className="mt-10">
        <EditFlavorForm flavor={data} />
      </div>
    </div>
  );
}
