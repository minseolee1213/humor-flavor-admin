import { AddHumorFlavorStepForm } from "@/components/humor-flavor-steps/add-step-form";
import { DeleteHumorFlavorStepForm } from "@/components/humor-flavor-steps/delete-step-form";
import { EditHumorFlavorStepForm } from "@/components/humor-flavor-steps/edit-step-form";
import { createClient } from "@/lib/supabase/server";
import { reorderHumorFlavorStep } from "@/lib/humor-flavor-steps/actions";
import type {
  HumorFlavorStepRow,
  LookupOption,
} from "@/lib/humor-flavor-steps/types";

function labelMap(rows: { id: number; label: string }[]): Map<number, string> {
  return new Map(rows.map((r) => [r.id, r.label]));
}

export async function HumorFlavorStepsPanel({
  humorFlavorId,
  flavorSlug,
}: {
  humorFlavorId: string;
  flavorSlug: string;
}) {
  const supabase = await createClient();

  const [
    stepsRes,
    inRes,
    outRes,
    modelsRes,
    stepTypesRes,
  ] = await Promise.all([
    supabase
      .from("humor_flavor_steps")
      .select("*")
      .eq("humor_flavor_id", humorFlavorId),
    supabase.from("llm_input_types").select("id, slug").order("slug"),
    supabase.from("llm_output_types").select("id, slug").order("slug"),
    supabase.from("llm_models").select("id, name").order("name"),
    supabase.from("humor_flavor_step_types").select("id, slug").order("slug"),
  ]);

  const lookupError =
    inRes.error ||
    outRes.error ||
    modelsRes.error ||
    stepTypesRes.error ||
    stepsRes.error;

  if (lookupError) {
    return (
      <section className="app-card overflow-hidden border-red-500/20">
        <div className="app-card-inner border-red-500/10 bg-red-500/5">
          <h2 className="app-h2 text-red-800 dark:text-red-200">
            Prompt chain (steps)
          </h2>
          <p className="app-lead mt-2 text-red-700 dark:text-red-300">
            Could not load steps or lookup tables: {lookupError.message}
          </p>
        </div>
      </section>
    );
  }

  const steps = [...((stepsRes.data ?? []) as HumorFlavorStepRow[])].sort(
    (a, b) => {
      if (a.order_by !== b.order_by) {
        return a.order_by - b.order_by;
      }
      return a.id - b.id;
    },
  );

  const inputTypes: LookupOption[] = (inRes.data ?? []).map((r) => ({
    id: r.id as number,
    label: `${r.slug} (id ${r.id})`,
  }));
  const outputTypes: LookupOption[] = (outRes.data ?? []).map((r) => ({
    id: r.id as number,
    label: `${r.slug} (id ${r.id})`,
  }));
  const models: LookupOption[] = (modelsRes.data ?? []).map((r) => ({
    id: r.id as number,
    label: `${r.name} (id ${r.id})`,
  }));
  const stepTypes: LookupOption[] = (stepTypesRes.data ?? []).map((r) => ({
    id: r.id as number,
    label: `${r.slug} (id ${r.id})`,
  }));

  const inM = labelMap(inputTypes);
  const outM = labelMap(outputTypes);
  const modelM = labelMap(models);
  const stepTM = labelMap(stepTypes);

  const canAdd =
    inputTypes.length > 0 &&
    outputTypes.length > 0 &&
    models.length > 0 &&
    stepTypes.length > 0;

  return (
    <section className="space-y-8">
      <div className="app-card overflow-hidden">
        <div className="border-b border-zinc-200/80 bg-gradient-to-r from-zinc-50 to-transparent px-5 py-4 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-transparent">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Prompt chain
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {flavorSlug}
            </span>{" "}
            runs as an ordered sequence of LLM steps. Execution is{" "}
            <strong className="font-mono text-red-600/90 dark:text-red-400">
              top → bottom
            </strong>{" "}
            by <span className="font-mono text-xs">order_by</span> (1 = first).
          </p>
        </div>

        {steps.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No steps yet
            </p>
            <p className="app-lead mt-2">
              Add the first step below — it becomes step 1.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="app-table min-w-[56rem]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Step type</th>
                  <th>Model</th>
                  <th>In → Out</th>
                  <th>Summary</th>
                  <th>Order</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, index) => {
                  const idStr = String(step.id);
                  const isFirst = index === 0;
                  const isLast = index === steps.length - 1;
                  const summary =
                    step.description?.trim() ||
                    [step.llm_system_prompt, step.llm_user_prompt]
                      .filter(Boolean)
                      .join(" ")
                      .slice(0, 80) ||
                    "—";
                  return (
                    <tr key={step.id} className="align-top">
                      <td className="font-mono text-zinc-500 dark:text-zinc-400">
                        {step.order_by}
                      </td>
                      <td className="font-medium text-zinc-900 dark:text-zinc-100">
                        {stepTM.get(step.humor_flavor_step_type_id) ?? "—"}
                      </td>
                      <td>{modelM.get(step.llm_model_id) ?? "—"}</td>
                      <td className="whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                        {inM.get(step.llm_input_type_id) ?? step.llm_input_type_id}
                        <span className="mx-1 text-zinc-400">→</span>
                        {outM.get(step.llm_output_type_id) ??
                          step.llm_output_type_id}
                      </td>
                      <td className="max-w-xs text-zinc-600 dark:text-zinc-400">
                        <span className="line-clamp-2" title={summary}>
                          {summary}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <form action={reorderHumorFlavorStep} className="inline">
                            <input
                              type="hidden"
                              name="humor_flavor_id"
                              value={humorFlavorId}
                            />
                            <input type="hidden" name="step_id" value={idStr} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              type="submit"
                              disabled={isFirst}
                              className="app-btn-secondary w-full px-2 py-1 text-xs disabled:pointer-events-none disabled:opacity-35"
                            >
                              Up
                            </button>
                          </form>
                          <form action={reorderHumorFlavorStep} className="inline">
                            <input
                              type="hidden"
                              name="humor_flavor_id"
                              value={humorFlavorId}
                            />
                            <input type="hidden" name="step_id" value={idStr} />
                            <input
                              type="hidden"
                              name="direction"
                              value="down"
                            />
                            <button
                              type="submit"
                              disabled={isLast}
                              className="app-btn-secondary w-full px-2 py-1 text-xs disabled:pointer-events-none disabled:opacity-35"
                            >
                              Down
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="text-right">
                        <DeleteHumorFlavorStepForm
                          humorFlavorId={humorFlavorId}
                          stepId={idStr}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {steps.map((step) => (
        <details
          key={`edit-${step.id}`}
          className="group app-card overflow-hidden open:ring-1 open:ring-red-500/20"
        >
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex w-full items-center justify-between gap-3">
              <span>
                Edit step {step.order_by}{" "}
                <span className="font-normal text-zinc-500">
                  (id {step.id})
                </span>
              </span>
              <span className="text-zinc-400 transition group-open:rotate-180">
                ▼
              </span>
            </span>
          </summary>
          <div className="border-t border-zinc-200/80 bg-zinc-50/50 px-5 py-5 dark:border-white/[0.06] dark:bg-black/20">
            <EditHumorFlavorStepForm
              humorFlavorId={humorFlavorId}
              step={step}
              inputTypes={inputTypes}
              outputTypes={outputTypes}
              models={models}
              stepTypes={stepTypes}
            />
          </div>
        </details>
      ))}

      <div className="app-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Add step
        </h3>
        <p className="app-lead mt-1">
          New steps append with the next{" "}
          <span className="app-kbd">order_by</span> value.
        </p>
        {canAdd ? (
          <div className="mt-6">
            <AddHumorFlavorStepForm
              humorFlavorId={humorFlavorId}
              inputTypes={inputTypes}
              outputTypes={outputTypes}
              models={models}
              stepTypes={stepTypes}
            />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            Lookup tables are empty or not visible under RLS. You need at least
            one row each in{" "}
            <span className="app-kbd">llm_input_types</span>,{" "}
            <span className="app-kbd">llm_output_types</span>,{" "}
            <span className="app-kbd">llm_models</span>, and{" "}
            <span className="app-kbd">humor_flavor_step_types</span> to add
            steps.
          </p>
        )}
      </div>
    </section>
  );
}
