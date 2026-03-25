import Link from "next/link";

import { CreateFlavorForm } from "@/components/humor-flavors/create-flavor-form";

export default function NewHumorFlavorPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/humor-flavors"
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to list
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          New humor flavor
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Required field: slug. Description is optional.
        </p>
      </div>
      <CreateFlavorForm />
    </div>
  );
}
