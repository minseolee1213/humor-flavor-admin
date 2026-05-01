import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="app-page">
      <div className="max-w-3xl space-y-5">
        <p className="app-eyebrow">Overview</p>
        <h1 className="app-h1">Dashboard</h1>
        <p className="app-lead max-w-2xl text-base leading-relaxed">
          Manage humor flavor records, prompt chains, and caption testing from
          one place.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:max-w-5xl">
        <Link
          href="/admin/humor-flavors"
          className="group app-card block overflow-hidden"
        >
          <div className="app-card-inner">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Humor flavors
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              List, create, edit, and delete flavor records. Open a flavor to
              configure steps and run caption tests.
            </p>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
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

        <Link
          href="/admin/humor-mix"
          className="group app-card block overflow-hidden"
        >
          <div className="app-card-inner">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Humor mix
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Manage which flavors are in the assignment mix. Only flavors with
              complete prompt chains can be added.
            </p>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
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

        <Link
          href="/admin/rating-stats"
          className="group app-card block overflow-hidden"
        >
          <div className="app-card-inner">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Rating stats
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              View voting metrics for captions, including upvote/downvote totals
              and top or lowest-performing captions.
            </p>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
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
