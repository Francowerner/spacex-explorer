"use client";

import {
  LaunchesPerYearChart,
  OutcomePieMini,
  SuccessRateChart,
} from "@/components/StatsCharts";
import type { YearlyStat } from "@/lib/api/stats";

export function StatsChartsPanels({ yearly }: { yearly: YearlyStat[] }) {
  return (
    <>
      <section aria-label="Outcome split" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Outcome split
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-2">
          <OutcomePieMini data={yearly} />
        </div>
      </section>

      <section aria-label="Launches per year" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Launches per year
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <LaunchesPerYearChart data={yearly} />
        </div>
      </section>

      <section aria-label="Success rate per year" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Success rate per year
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <SuccessRateChart data={yearly} />
        </div>
        <p className="text-xs text-zinc-600">
          Upcoming launches are excluded. Years with no completed launches are hidden.
        </p>
      </section>
    </>
  );
}
