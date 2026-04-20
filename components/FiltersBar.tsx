"use client";

import { useId } from "react";
import type { LaunchesFilters, LaunchesSort } from "@/lib/api/launches";

type Props = {
  filters: LaunchesFilters;
  sort: LaunchesSort;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onFiltersChange: (next: LaunchesFilters) => void;
  onSortChange: (next: LaunchesSort) => void;
  totalResults?: number;
};

export function FiltersBar({
  filters,
  sort,
  searchDraft,
  onSearchDraftChange,
  onFiltersChange,
  onSortChange,
  totalResults,
}: Props) {
  const searchId = useId();
  const statusId = useId();
  const outcomeId = useId();
  const fromId = useId();
  const toId = useId();
  const sortId = useId();

  const sortValue = `${sort.field}:${sort.direction}`;

  return (
    <section
      aria-label="Launch filters"
      className="sticky top-14 z-10 rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-300" id={`${searchId}-label`}>
            Search mission
          </span>
          <input
            id={searchId}
            aria-labelledby={`${searchId}-label`}
            type="search"
            inputMode="search"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            placeholder="e.g. Starlink, CRS, DART"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor={statusId}>
          <span className="text-zinc-600 dark:text-zinc-300">When</span>
          <select
            id={statusId}
            value={filters.status ?? "all"}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value as LaunchesFilters["status"] })
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor={outcomeId}>
          <span className="text-zinc-600 dark:text-zinc-300">Outcome</span>
          <select
            id={outcomeId}
            value={filters.outcome ?? "all"}
            onChange={(e) =>
              onFiltersChange({ ...filters, outcome: e.target.value as LaunchesFilters["outcome"] })
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">Any</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor={fromId}>
          <span className="text-zinc-600 dark:text-zinc-300">From</span>
          <input
            id={fromId}
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor={toId}>
          <span className="text-zinc-600 dark:text-zinc-300">To</span>
          <input
            id={toId}
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm" htmlFor={sortId}>
          <span className="text-zinc-600 dark:text-zinc-300">Sort by</span>
          <select
            id={sortId}
            value={sortValue}
            onChange={(e) => {
              const [field, direction] = e.target.value.split(":") as [
                LaunchesSort["field"],
                LaunchesSort["direction"],
              ];
              onSortChange({ field, direction });
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="date_utc:desc">Date (newest)</option>
            <option value="date_utc:asc">Date (oldest)</option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
          </select>
        </label>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {typeof totalResults === "number" ? (
            <span aria-live="polite">{totalResults.toLocaleString()} results</span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onFiltersChange({});
              onSearchDraftChange("");
            }}
            className="rounded-md border border-zinc-300 px-2 py-1 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
