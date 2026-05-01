import type { FlavorStepBadgeState } from "@/lib/humor-flavor-steps/step-complete";

const styles: Record<
  FlavorStepBadgeState,
  string
> = {
  ready:
    "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300",
  no_steps:
    "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300",
  incomplete:
    "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100",
};

const labels: Record<FlavorStepBadgeState, string> = {
  ready: "Ready",
  no_steps: "No steps",
  incomplete: "Incomplete steps",
};

export function FlavorPipelineBadge({ state }: { state: FlavorStepBadgeState }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}
