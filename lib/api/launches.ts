import { apiGet, apiPost } from "./client";
import {
  LaunchSchema,
  LaunchesPageSchema,
  type Launch,
  type LaunchesPage,
} from "./schemas";

export type LaunchesFilters = {
  search?: string;
  status?: "all" | "upcoming" | "past";
  outcome?: "all" | "success" | "failure";
  dateFrom?: string;
  dateTo?: string;
};

export type LaunchesSort = {
  field: "date_utc" | "name";
  direction: "asc" | "desc";
};

type QueryFilter = Record<string, unknown>;

function utcDayStartIso(ymd: string): string {
  // Interpret YYYY-MM-DD as a UTC calendar day (stable across timezones).
  return `${ymd}T00:00:00.000Z`;
}

function utcDayEndIso(ymd: string): string {
  return `${ymd}T23:59:59.999Z`;
}

function mergeDateUtc(filter: QueryFilter, partial: Record<string, string>): void {
  const existing = filter.date_utc;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    filter.date_utc = { ...(existing as Record<string, string>), ...partial };
    return;
  }
  filter.date_utc = partial;
}

function buildFilter(filters: LaunchesFilters): QueryFilter {
  const filter: QueryFilter = {};
  const nowIso = new Date().toISOString();

  if (filters.search?.trim()) {
    filter.name = { $regex: filters.search.trim(), $options: "i" };
  }

  if (filters.status === "upcoming") {
    filter.upcoming = true;
    // Upcoming launches should be in the future (API data can be stale/inconsistent).
    mergeDateUtc(filter, { $gte: nowIso });
  } else if (filters.status === "past") {
    filter.upcoming = false;
    mergeDateUtc(filter, { $lte: nowIso });
  }

  if (filters.outcome === "success") {
    filter.success = true;
    // Success/failure only makes sense for completed launches.
    filter.upcoming = false;
  } else if (filters.outcome === "failure") {
    filter.success = false;
    filter.upcoming = false;
  }

  if (filters.dateFrom) mergeDateUtc(filter, { $gte: utcDayStartIso(filters.dateFrom) });
  if (filters.dateTo) mergeDateUtc(filter, { $lte: utcDayEndIso(filters.dateTo) });

  return filter;
}

export const LAUNCHES_PAGE_LIMIT = 20;

/** SpaceX/Mongo-style sort: API expects numeric direction, not "asc"/"desc" strings. */
function apiSortOrder(direction: LaunchesSort["direction"]): 1 | -1 {
  return direction === "asc" ? 1 : -1;
}

/**
 * MongoDB does not define order among ties on the first key alone, so pagination and
 * full reloads can shuffle rows that share the same `date_utc` (common: midnight UTC).
 * A secondary key makes order stable across requests.
 */
function buildApiSort(sort: LaunchesSort): Record<string, 1 | -1> {
  const dir = apiSortOrder(sort.direction);
  if (sort.field === "date_utc") {
    return { date_utc: dir, flight_number: dir };
  }
  return { name: dir, flight_number: -1 };
}

export async function queryLaunches(args: {
  page: number;
  filters: LaunchesFilters;
  sort: LaunchesSort;
  signal?: AbortSignal;
}): Promise<LaunchesPage> {
  const { page, filters, sort, signal } = args;
  return apiPost(
    "/launches/query",
    {
      query: buildFilter(filters),
      options: {
        page,
        limit: LAUNCHES_PAGE_LIMIT,
        sort: buildApiSort(sort),
        select: [
          "id",
          "name",
          "date_utc",
          "success",
          "upcoming",
          "details",
          "rocket",
          "launchpad",
          "flight_number",
          "links",
        ],
      },
    },
    LaunchesPageSchema,
    { signal },
  );
}

export async function getLaunchById(id: string, signal?: AbortSignal): Promise<Launch> {
  return apiGet(`/launches/${encodeURIComponent(id)}`, LaunchSchema, {
    signal,
    revalidate: 3600,
  });
}
