import { redirect } from "next/navigation";

import { checkAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[auth/home] no user; redirect /login");
    redirect("/login");
  }

  const admin = await checkAdminAccess(supabase);

  if (admin.ok) {
    console.log("[auth/home] user is admin; redirect /admin");
    redirect("/admin");
  }

  console.log("[auth/home] user forbidden; redirect /unauthorized");
  redirect("/unauthorized");
}
