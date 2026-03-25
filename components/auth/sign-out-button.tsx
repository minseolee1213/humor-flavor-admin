"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  className?: string;
};

export function SignOutButton({
  label = "Sign out",
  className = "rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
}: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={() => void signOut()}>
      {label}
    </button>
  );
}
