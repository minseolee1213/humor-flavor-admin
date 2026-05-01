import type { HumorFlavorStepRow } from "@/lib/humor-flavor-steps/types";

type Props = {
  sourceSlug: string;
  targetSlug: string;
  sourceSteps: HumorFlavorStepRow[];
  targetSteps: HumorFlavorStepRow[];
};

function shortPrompt(v: string | null | undefined): string {
  const text = String(v ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "—";
  if (text.length <= 120) return text;
  return `${text.slice(0, 119)}…`;
}

export function CopiedStepsDiff({
  sourceSlug,
  targetSlug,
  sourceSteps,
  targetSteps,
}: Props) {
  const sourceByOrder = new Map<number, HumorFlavorStepRow>();
  const targetByOrder = new Map<number, HumorFlavorStepRow>();
  for (const step of sourceSteps) sourceByOrder.set(step.order_by, step);
  for (const step of targetSteps) targetByOrder.set(step.order_by, step);

  const orders = [...new Set([...sourceByOrder.keys(), ...targetByOrder.keys()])].sort(
    (a, b) => a - b,
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="app-h2">Copied steps diff</h2>
        <p className="app-lead mt-1">
          Side-by-side check of copied rows. Only prompt wording should be edited
          after copy; keep ID/model/type structure aligned to the working source.
        </p>
      </div>
      <div className="app-table-wrap">
        <table className="app-table text-xs sm:text-sm">
          <thead>
            <tr>
              <th>Order</th>
              <th>{sourceSlug} (source)</th>
              <th>{targetSlug} (copied)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const s = sourceByOrder.get(order);
              const t = targetByOrder.get(order);
              const sameCore =
                !!s &&
                !!t &&
                s.llm_input_type_id === t.llm_input_type_id &&
                s.llm_output_type_id === t.llm_output_type_id &&
                s.humor_flavor_step_type_id === t.humor_flavor_step_type_id &&
                s.llm_model_id === t.llm_model_id &&
                (s.llm_temperature ?? null) === (t.llm_temperature ?? null);
              return (
                <tr key={order}>
                  <td className="font-mono">{order}</td>
                  <td>
                    {s ? (
                      <div className="space-y-1">
                        <div className="font-mono">
                          in:{s.llm_input_type_id} out:{s.llm_output_type_id} step:
                          {s.humor_flavor_step_type_id} model:{s.llm_model_id} temp:
                          {s.llm_temperature ?? "—"}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300">
                          sys: {shortPrompt(s.llm_system_prompt)}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300">
                          usr: {shortPrompt(s.llm_user_prompt)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-300">Missing</span>
                    )}
                  </td>
                  <td>
                    {t ? (
                      <div className="space-y-1">
                        <div className="font-mono">
                          in:{t.llm_input_type_id} out:{t.llm_output_type_id} step:
                          {t.humor_flavor_step_type_id} model:{t.llm_model_id} temp:
                          {t.llm_temperature ?? "—"}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300">
                          sys: {shortPrompt(t.llm_system_prompt)}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300">
                          usr: {shortPrompt(t.llm_user_prompt)}
                        </div>
                        <div
                          className={
                            sameCore
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-amber-700 dark:text-amber-300"
                          }
                        >
                          {sameCore ? "Core IDs/model match source" : "Core IDs/model differ"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-300">Missing</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
