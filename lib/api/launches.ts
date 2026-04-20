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

function buildFilter(filters: LaunchesFilters): QueryFilter {
  const filter: QueryFilter = {};

  if (filters.search?.trim()) {
    filter.name = { $regex: filters.search.trim(), $options: "i" };
  }

  if (filters.status === "upcoming") filter.upcoming = true;
  else if (filters.status === "past") filter.upcoming = false;

  if (filters.outcome === "success") filter.success = true;
  else if (filters.outcome === "failure") filter.success = false;

  const dateFilter: Record<string, string> = {};
  if (filters.dateFrom) dateFilter.$gte = new Date(filters.dateFrom).toISOString();
  if (filters.dateTo) dateFilter.$lte = new Date(filters.dateTo).toISOString();
  if (Object.keys(dateFilter).length > 0) filter.date_utc = dateFilter;

  return filter;
}

export const LAUNCHES_PAGE_LIMIT = 20;

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
        sort: { [sort.field]: sort.direction },
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
