import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Choose a section to manage the backend configuration.
        </p>
      </div>
      <ul className="space-y-2">
        <li>
          <Link
            href="/admin/humor-flavors"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
          >
            Humor flavors
          </Link>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            List, create, edit, and delete flavor records.
          </p>
        </li>
      </ul>
    </div>
  );
}
