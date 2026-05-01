import Link from "next/link";

import { CreateFlavorForm } from "@/components/humor-flavors/create-flavor-form";

export default function NewHumorFlavorPage() {
  return (
    <div className="app-page">
      <div className="max-w-lg space-y-4">
        <Link href="/admin/humor-flavors" className="app-link-back">
          ← Humor flavors
        </Link>
        <p className="app-eyebrow pt-2">Create</p>
        <h1 className="app-h1">New humor flavor</h1>
        <p className="app-lead text-base">
          Required field: slug. Description is optional.
        </p>
      </div>
      <div className="mt-10">
        <CreateFlavorForm />
      </div>
    </div>
  );
}
