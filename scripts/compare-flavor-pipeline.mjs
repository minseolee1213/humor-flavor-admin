/**
 * Compare two humor_flavors for caption pipeline readiness (steps + mix).
 * Usage: node scripts/compare-flavor-pipeline.mjs <failingId> <workingId>
 * Example: node scripts/compare-flavor-pipeline.mjs 285 55
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const p = new URL("../.env.local", import.meta.url);
  if (!fs.existsSync(p)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
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
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(url, key);

const [a, b] = process.argv.slice(2).map((x) => Number(x, 10));
if (!a || !b || !Number.isInteger(a) || !Number.isInteger(b)) {
  console.error(
    "Usage: node scripts/compare-flavor-pipeline.mjs <failingId> <workingId>",
  );
  process.exit(1);
}

async function flavorMeta(id) {
  const { data, error } = await sb
    .from("humor_flavors")
    .select("id, name, description")
    .eq("id", id)
    .maybeSingle();
  return { data, error };
}

async function steps(id) {
  const { data, error } = await sb
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", id)
    .order("order_by", { ascending: true });
  return { rows: data ?? [], error };
}

async function mixRows(id) {
  const { data, error } = await sb
    .from("humor_flavor_mix")
    .select("*")
    .eq("humor_flavor_id", id);
  return { rows: data ?? [], error };
}

async function llmModel(id) {
  const { data } = await sb.from("llm_models").select("*").eq("id", id).maybeSingle();
  return data;
}

const { data: mixSample } = await sb.from("humor_flavor_mix").select("*").limit(1);
console.log("humor_flavor_mix sample columns:", mixSample?.[0] ? Object.keys(mixSample[0]) : "(no rows)");

for (const label of ["A (arg1)", "B (arg2)"]) {
  const id = label.startsWith("A") ? a : b;
  console.log("\n==========", label, "humor_flavor_id=", id, "==========");
  const meta = await flavorMeta(id);
  console.log("flavor:", meta.error?.message ?? meta.data);

  const s = await steps(id);
  console.log("steps error:", s.error?.message ?? "none");
  console.log("step count:", s.rows.length);
  if (s.rows.length === 0) {
    console.log("(no humor_flavor_steps — pipeline cannot run a chain)");
  }
  const orders = s.rows.map((r) => r.order_by);
  const uniqueOrders = new Set(orders);
  console.log("order_by values:", orders);
  console.log("order_by unique / contiguous 1..n:", {
    unique: uniqueOrders.size === orders.length,
    min: Math.min(...orders, 0),
    max: Math.max(...orders, 0),
  });

  for (const r of s.rows) {
    const model = await llmModel(r.llm_model_id);
    console.log("  step id", r.id, "order", r.order_by, {
      humor_flavor_step_type_id: r.humor_flavor_step_type_id,
      llm_model_id: r.llm_model_id,
      llm_input_type_id: r.llm_input_type_id,
      llm_output_type_id: r.llm_output_type_id,
      llm_model_row: model
        ? {
            id: model.id,
            name: model.name,
            keys: Object.keys(model),
          }
        : "MISSING ROW (invalid FK)",
    });
  }

  const m = await mixRows(id);
  console.log("humor_flavor_mix error:", m.error?.message ?? "none");
  console.log("humor_flavor_mix row count:", m.rows.length);
  if (m.rows.length) {
    console.log(JSON.stringify(m.rows, null, 2));
  }
}

console.log("\n========== SIDE-BY-SIDE SUMMARY ==========");
const sa = await steps(a);
const sb_ = await steps(b);
const ma = await mixRows(a);
const mb = await mixRows(b);
console.log(JSON.stringify({
  A: { id: a, stepCount: sa.rows.length, mixCount: ma.rows.length },
  B: { id: b, stepCount: sb_.rows.length, mixCount: mb.rows.length },
  diff: {
    onlyA_order_by: sa.rows.map((r) => r.order_by),
    onlyB_order_by: sb_.rows.map((r) => r.order_by),
    A_missing_model_rows: (
      await Promise.all(
        sa.rows.map(async (r) => {
          const m = await llmModel(r.llm_model_id);
          return m ? null : r.llm_model_id;
        }),
      )
    ).filter(Boolean),
    B_missing_model_rows: (
      await Promise.all(
        sb_.rows.map(async (r) => {
          const m = await llmModel(r.llm_model_id);
          return m ? null : r.llm_model_id;
        }),
      )
    ).filter(Boolean),
  },
}, null, 2));
