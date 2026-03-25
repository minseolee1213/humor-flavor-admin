import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="app-page">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600/90 dark:text-red-500/90">
          Overview
        </p>
        <h1 className="app-h1 mt-2">Dashboard</h1>
        <p className="app-lead mt-3 max-w-lg">
          Manage humor flavor records, prompt chains, and caption testing from
          one place.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
        <Link
          href="/admin/humor-flavors"
          className="group app-card block overflow-hidden transition hover:border-red-500/25"
        >
          <div className="app-card-inner">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Humor flavors
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              List, create, edit, and delete flavor records. Open a flavor to
              configure steps and run caption tests.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-red-600 dark:text-[var(--accent)]">
              Open
              <span
                className="ml-1 transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
