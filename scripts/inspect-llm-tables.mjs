import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const p = new URL("../.env.local", import.meta.url);
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadEnvLocal();
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

for (const t of ["llm_providers", "llm_prompt_chains", "llm_model_responses"]) {
  const r = await sb.from(t).select("*").limit(1);
  console.log(
    t,
    r.error?.message ?? "ok",
    r.data?.[0] ? Object.keys(r.data[0]) : r.data,
  );
}

const prov = await sb.from("llm_providers").select("*");
console.log("\nllm_providers rows:", prov.data?.length, prov.error?.message);
console.log(JSON.stringify(prov.data, null, 2));

const mixCount = await sb.from("humor_flavor_mix").select("id", { count: "exact", head: true });
console.log("\nhumor_flavor_mix total count:", mixCount.count, mixCount.error?.message);
