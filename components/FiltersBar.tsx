"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { LaunchesFilters, LaunchesSort } from "@/lib/api/launches";

type DatePickerInputHandle = HTMLInputElement & { showPicker?: () => void };

function openPicker(el: HTMLInputElement | null) {
  if (!el) return;
  const withPicker = el as DatePickerInputHandle;
  if (typeof withPicker.showPicker === "function") {
    try {
      withPicker.showPicker();
      return;
    } catch {
      /* fall through */
    }
  }
  el.focus();
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-zinc-600"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

type Status = NonNullable<LaunchesFilters["status"]>;
type Outcome = NonNullable<LaunchesFilters["outcome"]>;

type Props = {
  filters: LaunchesFilters;
  sort: LaunchesSort;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onStatusChange: (value: Status) => void;
  onOutcomeChange: (value: Outcome) => void;
  onDateFromChange: (value: string | undefined) => void;
  onDateToChange: (value: string | undefined) => void;
  onSortChange: (next: LaunchesSort) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  loadedResults?: number;
  totalResults?: number;
};

export function FiltersBar({
  filters,
  sort,
  searchDraft,
  onSearchDraftChange,
  onStatusChange,
  onOutcomeChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onClearAll,
  onRefresh,
  isRefreshing = false,
  loadedResults,
  totalResults,
}: Props) {
  const searchId = useId();
  const statusId = useId();
  const outcomeId = useId();
  const fromId = useId();
  const toId = useId();
  const sortId = useId();
  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const sortValue = `${sort.field}:${sort.direction}`;

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = useMemo(() => {
    let n = 0;
    if ((filters.search ?? "").trim()) n++;
    if (filters.status && filters.status !== "all") n++;
    if (filters.outcome && filters.outcome !== "all") n++;
    if (filters.dateFrom) n++;
    if (filters.dateTo) n++;
    return n;
  }, [filters]);

  const sortIsDefault = sort.field === "date_utc" && sort.direction === "desc";
  const canClear = activeCount > 0 || !sortIsDefault;

  const resultsLabel =
    typeof totalResults === "number"
      ? typeof loadedResults === "number"
        ? `${loadedResults.toLocaleString()} / ${totalResults.toLocaleString()} shown`
        : `${totalResults.toLocaleString()} results`
      : "";

  return (
    <section
      aria-label="Launch filters"
      className="sticky top-3 z-20 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          <span>{mobileOpen ? "Hide filters" : "Show filters"}</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-950">
              {activeCount}
            </span>
          )}
        </button>
        {resultsLabel && (
          <span className="text-xs text-zinc-600" aria-live="polite">
            {resultsLabel}
          </span>
        )}
      </div>

      <div className={clsx("mt-3 sm:mt-0", !mobileOpen && "hidden sm:block")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="col-span-2 flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Search mission</span>
            <input
              id={searchId}
              type="search"
              inputMode="search"
              autoComplete="off"
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              placeholder="e.g. Starlink, CRS, DART"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-2 focus:outline-offset-1 focus:outline-sky-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm" htmlFor={statusId}>
            <span className="text-zinc-600">When</span>
            <select
              id={statusId}
              value={filters.status ?? "all"}
              onChange={(e) => onStatusChange(e.target.value as Status)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm" htmlFor={outcomeId}>
            <span className="text-zinc-600">Outcome</span>
            <select
              id={outcomeId}
              value={filters.outcome ?? "all"}
              onChange={(e) => onOutcomeChange(e.target.value as Outcome)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Any</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <label className="text-zinc-600" htmlFor={fromId}>From</label>
            <button
              id={fromId}
              type="button"
              onClick={() => openPicker(fromRef.current)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500"
            >
              <span className={filters.dateFrom ? "text-zinc-900" : "text-zinc-600"}>
                {filters.dateFrom || "Pick a date"}
              </span>
              <CalendarIcon />
            </button>
            <input
              ref={fromRef}
              type="date"
              value={filters.dateFrom ?? ""}
              max={filters.dateTo || undefined}
              onChange={(e) => onDateFromChange(e.target.value || undefined)}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <label className="text-zinc-600" htmlFor={toId}>To</label>
            <button
              id={toId}
              type="button"
              onClick={() => openPicker(toRef.current)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500"
            >
              <span className={filters.dateTo ? "text-zinc-900" : "text-zinc-600"}>
                {filters.dateTo || "Pick a date"}
              </span>
              <CalendarIcon />
            </button>
            <input
              ref={toRef}
              type="date"
              value={filters.dateTo ?? ""}
              min={filters.dateFrom || undefined}
              onChange={(e) => onDateToChange(e.target.value || undefined)}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm" htmlFor={sortId}>
            <span className="text-zinc-600">Sort by</span>
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
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="date_utc:desc">Date (newest)</option>
              <option value="date_utc:asc">Date (oldest)</option>
              <option value="name:asc">Name (A–Z)</option>
              <option value="name:desc">Name (Z–A)</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 sm:gap-3">
            <span className="hidden sm:inline" aria-live="polite">
              {resultsLabel}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-md border border-zinc-300 px-2 py-1 font-medium hover:bg-zinc-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={onClearAll}
              disabled={!canClear}
              className="rounded-md border border-zinc-300 px-2 py-1 font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
