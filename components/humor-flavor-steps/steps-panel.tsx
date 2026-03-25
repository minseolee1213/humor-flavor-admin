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
      <section className="rounded-lg border border-red-200 bg-red-50/80 p-4 dark:border-red-900 dark:bg-red-950/30">
        <h2 className="font-semibold text-red-900 dark:text-red-100">
          Prompt chain (steps)
        </h2>
        <p className="mt-2 text-sm text-red-800 dark:text-red-200">
          Could not load steps or lookup tables: {lookupError.message}
        </p>
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
    <section className="space-y-6">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
        <h2 className="text-lg font-semibold text-indigo-950 dark:text-indigo-100">
          Prompt chain
        </h2>
        <p className="mt-1 text-sm text-indigo-900/90 dark:text-indigo-200/90">
          Humor flavor <strong>{flavorSlug}</strong> is an ordered sequence of
          LLM steps. Each row is one step in the chain; runs execute{" "}
          <strong>from top to bottom</strong> using the{" "}
          <strong className="font-mono">order_by</strong> column (1 = first).
        </p>
      </div>

      {steps.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          No steps yet. Add the first step below — it will become step 1.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  #
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  Step type
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  Model
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  In → Out
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  Summary
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  Order
                </th>
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
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
                  <tr
                    key={step.id}
                    className="align-top bg-white dark:bg-zinc-950"
                  >
                    <td className="px-3 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {step.order_by}
                    </td>
                    <td className="px-3 py-3 text-zinc-800 dark:text-zinc-200">
                      {stepTM.get(step.humor_flavor_step_type_id) ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-800 dark:text-zinc-200">
                      {modelM.get(step.llm_model_id) ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {inM.get(step.llm_input_type_id) ?? step.llm_input_type_id}
                      <span className="mx-1 text-zinc-400">→</span>
                      {outM.get(step.llm_output_type_id) ??
                        step.llm_output_type_id}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      <span className="line-clamp-2" title={summary}>
                        {summary}
                      </span>
                    </td>
                    <td className="px-3 py-3">
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
                            className="w-full rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900"
                          >
                            Move up
                          </button>
                        </form>
                        <form action={reorderHumorFlavorStep} className="inline">
                          <input
                            type="hidden"
                            name="humor_flavor_id"
                            value={humorFlavorId}
                          />
                          <input type="hidden" name="step_id" value={idStr} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={isLast}
                            className="w-full rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900"
                          >
                            Move down
                          </button>
                        </form>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <DeleteHumorFlavorStepForm
                          humorFlavorId={humorFlavorId}
                          stepId={idStr}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {steps.map((step) => (
        <details
          key={`edit-${step.id}`}
          className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <summary className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Edit step {step.order_by}{" "}
            <span className="font-normal text-zinc-500">
              (id {step.id})
            </span>
          </summary>
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
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

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Add step
        </h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          New steps are appended with the next <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">order_by</code> value.
        </p>
        {canAdd ? (
          <div className="mt-4">
            <AddHumorFlavorStepForm
              humorFlavorId={humorFlavorId}
              inputTypes={inputTypes}
              outputTypes={outputTypes}
              models={models}
              stepTypes={stepTypes}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Lookup tables are empty or not visible under RLS. You need at least
            one row each in{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              llm_input_types
            </code>
            ,{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              llm_output_types
            </code>
            ,{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              llm_models
            </code>
            , and{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              humor_flavor_step_types
            </code>{" "}
            to add steps.
          </p>
        )}
      </div>
    </section>
  );
}
