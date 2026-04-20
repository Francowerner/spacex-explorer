import type { LaunchesFilters, LaunchesSort } from "./api/launches";

export type ReadableParams = {
  get(name: string): string | null;
};

export function parseFiltersFromParams(sp: ReadableParams): LaunchesFilters {
  const status = sp.get("status");
  const outcome = sp.get("outcome");
  return {
    search: sp.get("q") ?? undefined,
    status:
      status === "upcoming" || status === "past" ? status : ("all" as const),
    outcome:
      outcome === "success" || outcome === "failure" ? outcome : ("all" as const),
    dateFrom: sp.get("from") ?? undefined,
    dateTo: sp.get("to") ?? undefined,
  };
}

export function parseSortFromParams(sp: ReadableParams): LaunchesSort {
  const raw = sp.get("sort");
  if (raw) {
    const [field, direction] = raw.split(":");
    if (
      (field === "date_utc" || field === "name") &&
      (direction === "asc" || direction === "desc")
    ) {
      return { field, direction };
    }
  }
  return { field: "date_utc", direction: "desc" };
}

export function applyFiltersToParams(
  base: URLSearchParams,
  filters: Omit<LaunchesFilters, "search">,
): URLSearchParams {
  const p = new URLSearchParams(base);
  setOrDelete(p, "status", filters.status && filters.status !== "all" ? filters.status : null);
  setOrDelete(
    p,
    "outcome",
    filters.outcome && filters.outcome !== "all" ? filters.outcome : null,
  );
  setOrDelete(p, "from", filters.dateFrom || null);
  setOrDelete(p, "to", filters.dateTo || null);
  return p;
}

export function applySortToParams(base: URLSearchParams, sort: LaunchesSort): URLSearchParams {
  const p = new URLSearchParams(base);
  const value = `${sort.field}:${sort.direction}`;
  if (value === "date_utc:desc") p.delete("sort");
  else p.set("sort", value);
  return p;
}

export function applySearchToParams(base: URLSearchParams, search: string): URLSearchParams {
  const p = new URLSearchParams(base);
  setOrDelete(p, "q", search.trim() || null);
  return p;
}

function setOrDelete(p: URLSearchParams, key: string, value: string | null) {
  if (value) p.set(key, value);
  else p.delete(key);
}
