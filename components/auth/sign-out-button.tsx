"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  className?: string;
};

export function SignOutButton({
  label = "Sign out",
  className = "app-btn-header",
}: Props) {
  const router = useRouter();
  const [routerReady, setRouterReady] = useState(false);

  useEffect(() => {
    setRouterReady(true);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (!routerReady) {
      // Fallback to a hard navigation if router isn't initialized yet.
      // This avoids "router action dispatched before initialization".
      window.location.assign("/login");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={() => void signOut()}>
      {label}
    </button>
  );
}
