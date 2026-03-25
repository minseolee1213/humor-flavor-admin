"use client";

import { createClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
};

export function GoogleSignInButton({ nextPath }: Props) {
  async function signInWithGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    const next = encodeURIComponent(nextPath);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${next}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      Continue with Google
    </button>
  );
}
