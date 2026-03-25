import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export default function UnauthorizedPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(229,9,20,0.15),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-4">
        <div className="max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500/90">
            Access denied
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Unauthorized
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            You are signed in, but this account does not have admin access.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <SignOutButton />
          <Link
            href="/login"
            className="text-sm font-semibold text-red-400 underline-offset-4 transition hover:text-red-300 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
