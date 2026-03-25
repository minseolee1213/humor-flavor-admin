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

const stepTypes = await sb.from("humor_flavor_step_types").select("*").order("id");
const inTypes = await sb.from("llm_input_types").select("*").order("id");
const outTypes = await sb.from("llm_output_types").select("*").order("id");

console.log("humor_flavor_step_types:", JSON.stringify(stepTypes.data, null, 2));
console.log("llm_input_types:", JSON.stringify(inTypes.data, null, 2));
console.log("llm_output_types:", JSON.stringify(outTypes.data, null, 2));

const mix = await sb.from("humor_flavor_mix").select("*");
console.log("all humor_flavor_mix rows:", JSON.stringify(mix.data, null, 2));
