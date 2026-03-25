import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-foreground">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          You are signed in, but this account does not have admin access.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <SignOutButton />
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
