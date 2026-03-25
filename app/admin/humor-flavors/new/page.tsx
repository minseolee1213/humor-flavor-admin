import Link from "next/link";

import { CreateFlavorForm } from "@/components/humor-flavors/create-flavor-form";

export default function NewHumorFlavorPage() {
  return (
    <div className="app-page">
      <div className="max-w-lg">
        <Link href="/admin/humor-flavors" className="app-link-back">
          ← Humor flavors
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-600/90 dark:text-red-500/90">
          Create
        </p>
        <h1 className="app-h1 mt-2">New humor flavor</h1>
        <p className="app-lead mt-3">
          Required field: slug. Description is optional.
        </p>
      </div>
      <div className="mt-10">
        <CreateFlavorForm />
      </div>
    </div>
  );
}
