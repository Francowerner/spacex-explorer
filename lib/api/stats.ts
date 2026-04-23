import { z } from "zod";
import { apiPost } from "./client";

const StatLaunchSchema = z
  .object({
    date_utc: z.string(),
    success: z.boolean().nullable(),
    upcoming: z.boolean(),
  })
  .passthrough();

export type StatLaunch = z.infer<typeof StatLaunchSchema>;

const StatsQueryPageSchema = z
  .object({
    docs: z.array(StatLaunchSchema),
    hasNextPage: z.boolean(),
    nextPage: z.number().nullable().optional(),
    page: z.number().optional(),
  })
  .passthrough();

export type YearlyStat = {
  year: number;
  total: number;
  success: number;
  failure: number;
  upcoming: number;
  successRate: number | null;
};

const STATS_PAGE_LIMIT = 500;
const STATS_MAX_PAGES = 50;

export async function getAllLaunchesForStats(signal?: AbortSignal): Promise<StatLaunch[]> {
  const all: StatLaunch[] = [];
  let page = 1;

  while (page <= STATS_MAX_PAGES) {
    const res = await apiPost(
      "/launches/query",
      {
        query: {},
        options: {
          limit: STATS_PAGE_LIMIT,
          page,
          select: ["date_utc", "success", "upcoming"],
          sort: { date_utc: 1, flight_number: 1 },
        },
      },
      StatsQueryPageSchema,
      { signal, revalidate: 86_400 },
    );

    all.push(...res.docs);
    if (!res.hasNextPage || res.docs.length === 0) break;
    page += 1;
  }

  return all;
}

export function aggregateByYear(launches: StatLaunch[]): YearlyStat[] {
  const byYear = new Map<number, YearlyStat>();
  for (const launch of launches) {
    const year = new Date(launch.date_utc).getUTCFullYear();
    if (Number.isNaN(year)) continue;
    const entry =
      byYear.get(year) ??
      ({ year, total: 0, success: 0, failure: 0, upcoming: 0, successRate: null } as YearlyStat);
    entry.total += 1;
    if (launch.upcoming) entry.upcoming += 1;
    else if (launch.success === true) entry.success += 1;
    else if (launch.success === false) entry.failure += 1;
    byYear.set(year, entry);
  }
  const rows = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  for (const row of rows) {
    const completed = row.success + row.failure;
    row.successRate = completed === 0 ? null : Math.round((row.success / completed) * 100);
  }
  return rows;
}

export function computeOverall(launches: StatLaunch[]): {
  total: number;
  success: number;
  failure: number;
  upcoming: number;
  successRate: number | null;
} {
  let success = 0;
  let failure = 0;
  let upcoming = 0;
  for (const launch of launches) {
    if (launch.upcoming) upcoming += 1;
    else if (launch.success === true) success += 1;
    else if (launch.success === false) failure += 1;
  }
  const completed = success + failure;
  return {
    total: launches.length,
    success,
    failure,
    upcoming,
    successRate: completed === 0 ? null : Math.round((success / completed) * 100),
  };
}
