import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { BackToLaunchesNav } from "@/components/BackToLaunchesNav";
import {
  aggregateByYear,
  computeOverall,
  getAllLaunchesForStats,
} from "@/lib/api/stats";
import { ErrorState } from "@/components/ErrorState";

const StatsChartsPanels = nextDynamic(
  () => import("@/components/StatsChartsPanels").then((m) => ({ default: m.StatsChartsPanels })),
  {
    loading: () => (
      <div className="space-y-8" aria-busy="true" aria-label="Loading charts">
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
        <div className="h-72 animate-pulse rounded-xl bg-zinc-100" />
        <div className="h-72 animate-pulse rounded-xl bg-zinc-100" />
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: "Stats · SpaceX Explorer",
  description: "Launches per year and success rate across SpaceX's history.",
};

/** Avoid static generation at build time: full-archive fetch often exceeds the ~60s build worker limit on Vercel. */
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  let yearly: ReturnType<typeof aggregateByYear>;
  let overall: ReturnType<typeof computeOverall>;
  try {
    const launches = await getAllLaunchesForStats();
    yearly = aggregateByYear(launches);
    overall = computeOverall(launches);
  } catch (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
        <ErrorState message={error instanceof Error ? error.message : "Failed to load stats"} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <BackToLaunchesNav className="cursor-pointer bg-transparent p-0 font-inherit text-inherit hover:underline" />
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Launch stats</h1>
        <p className="text-sm text-zinc-600">
          Aggregated from the full SpaceX archive. Data is fetched on request and cached (24h) via Next.js fetch cache.
        </p>
      </header>

      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryCard label="Total launches" value={overall.total.toString()} />
        <SummaryCard
          label="Success rate"
          value={overall.successRate === null ? "—" : `${overall.successRate}%`}
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Failures"
          value={overall.failure.toString()}
          accent="text-rose-600"
        />
        <SummaryCard
          label="Upcoming"
          value={overall.upcoming.toString()}
          accent="text-sky-600"
        />
      </section>

      <StatsChartsPanels yearly={yearly} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p>
      <p className={`text-xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
