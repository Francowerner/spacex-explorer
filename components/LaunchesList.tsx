"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useLaunches } from "@/hooks/useLaunches";
import { useDebouncedWithFlush } from "@/hooks/useDebounce";
import { useFiltersURL } from "@/hooks/useFiltersURL";
import type { Launch } from "@/lib/api/schemas";
import { LaunchCard } from "./LaunchCard";
import { LaunchCardSkeleton } from "./Skeletons";
import { ErrorState, EmptyState } from "./ErrorState";
import { FiltersBar } from "./FiltersBar";

/** Matches `grid gap-3` between columns in a row. */
const GRID_GAP = 12;
/** Vertical space between virtualized rows (tighter than column gap). */
const ROW_GAP = 8;

/** Matches `main` in layout: `max-w-6xl` (72rem) + horizontal padding `px-4`. */
const MAIN_MAX_PX = 1152;

/**
 * Fixed row heights without `measureElement`. Mobile: horizontal card height. sm+: column card =
 * square image (cell width) + text block — derived from inner content width so 2-col and 4-col
 * stay accurate across breakpoints.
 */
function estimateRowHeight(columns: number, contentInnerWidth: number): number {
  if (columns <= 1) return 116 + ROW_GAP;
  const inner = Math.max(280, contentInnerWidth);
  const cell = (inner - (columns - 1) * GRID_GAP) / columns;
  const textBlock = 108;
  return Math.ceil(cell) + textBlock + ROW_GAP;
}

function innerWidthFromViewport(viewportWidth: number): number {
  return Math.min(MAIN_MAX_PX, viewportWidth) - 32;
}

function getColumnCount(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

type LaunchesListProps = {
  /** From `page` `await searchParams` — keeps SSR + hydration aligned with the URL. */
  initialQueryString: string;
};

export function LaunchesList({ initialQueryString }: LaunchesListProps) {
  const { filters, sort, setFilter, setSort, clearAll } = useFiltersURL(initialQueryString);

  // The search input is the only control that needs local draft state because
  // we debounce typing before committing to the URL. Everything else
  // (status, outcome, dates, sort) reads directly from filters/sort and writes
  // directly via setFilter/setSort — no drafts, no refs, no mirrors.
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [debouncedSearch, flushSearchDebounced] = useDebouncedWithFlush(searchDraft.trim(), 300);

  // Sync draft ⇐ URL when the URL changes from outside this input
  // (back/forward, Clear button, another tab).
  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  // Commit draft ⇒ URL when debounced value diverges from the URL.
  useEffect(() => {
    const urlValue = filters.search ?? "";
    if (debouncedSearch === urlValue) return;
    setFilter("search", debouncedSearch || undefined);
  }, [debouncedSearch, filters.search, setFilter]);

  const handleClearAll = () => {
    setSearchDraft("");
    flushSearchDebounced("");
    clearAll();
  };

  const query = useLaunches({ filters, sort });
  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    refetch,
  } = query;

  const launches = useMemo<Launch[]>(
    () => (data?.pages ?? []).flatMap((p) => p.docs),
    [data],
  );

  const totalResults = data?.pages?.[0]?.totalDocs;

  // Scroll to top whenever any filter or the sort changes so the user sees
  // the (potentially smaller) result set from the top — otherwise they can
  // land on blank space below a now-shorter list.
  const filtersKey = `${filters.search ?? ""}|${filters.status ?? ""}|${filters.outcome ?? ""}|${filters.dateFrom ?? ""}|${filters.dateTo ?? ""}|${sort.field}:${sort.direction}`;
  const lastFiltersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (lastFiltersKeyRef.current === filtersKey) return;
    lastFiltersKeyRef.current = filtersKey;
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    });
  }, [filtersKey]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingNextRef = useRef(isFetchingNextPage);
  isFetchingNextRef.current = isFetchingNextPage;

  const [scrollMargin, setScrollMargin] = useState(0);
  const [columns, setColumns] = useState(1);
  const [gridInnerWidth, setGridInnerWidth] = useState(() =>
    typeof window !== "undefined" ? innerWidthFromViewport(window.innerWidth) : MAIN_MAX_PX - 32,
  );
  const layoutMetricsRef = useRef<() => void>(() => {});

  useEffect(() => {
    const raf = { outer: 0, inner: 0 };
    let debounceId: number | undefined;

    const run = () => {
      if (raf.outer) cancelAnimationFrame(raf.outer);
      raf.outer = requestAnimationFrame(() => {
        if (raf.inner) cancelAnimationFrame(raf.inner);
        raf.inner = requestAnimationFrame(() => {
          raf.outer = 0;
          raf.inner = 0;
          const vw = window.innerWidth;
          setGridInnerWidth(innerWidthFromViewport(vw));
          setColumns(getColumnCount(vw));
          const root = parentRef.current;
          if (root) setScrollMargin(root.offsetTop);
        });
      });
    };

    layoutMetricsRef.current = run;

    const onResize = () => {
      clearTimeout(debounceId);
      debounceId = window.setTimeout(run, 120);
    };

    run();
    window.addEventListener("resize", onResize, { passive: true });
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    return () => {
      clearTimeout(debounceId);
      if (raf.outer) cancelAnimationFrame(raf.outer);
      if (raf.inner) cancelAnimationFrame(raf.inner);
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (launches.length === 0) return;
    layoutMetricsRef.current();
  }, [launches.length]);

  const rowCount = Math.ceil(launches.length / columns) + (hasNextPage ? 1 : 0);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight(columns, gridInnerWidth),
    overscan: 4,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node || !hasNextPage || launches.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (isFetchingNextRef.current) return;
        void fetchNextPage();
      },
      { root: null, rootMargin: "900px 0px", threshold: 0 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, launches.length, totalSize]);

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar
        filters={filters}
        sort={sort}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onStatusChange={(v) => setFilter("status", v)}
        onOutcomeChange={(v) => setFilter("outcome", v)}
        onDateFromChange={(v) => setFilter("dateFrom", v)}
        onDateToChange={(v) => setFilter("dateTo", v)}
        onSortChange={setSort}
        onClearAll={handleClearAll}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching && !isFetchingNextPage}
        loadedResults={launches.length}
        totalResults={totalResults}
      />

      <h2 className="sr-only">Launch results</h2>

      {status === "pending" ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading launches"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <LaunchCardSkeleton key={i} />
          ))}
        </div>
      ) : status === "error" ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={() => void refetch()}
        />
      ) : launches.length === 0 ? (
        <EmptyState
          title="No launches match your filters"
          message="Try clearing a filter or searching for a different mission name."
        />
      ) : (
        <div ref={parentRef} className="relative w-full">
          <div
            style={{
              height: `${totalSize}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((vi) => {
              const rowStart = vi.index * columns;
              const rowLaunches = launches.slice(rowStart, rowStart + columns);
              const translateY = vi.start - virtualizer.options.scrollMargin;
              const isLoaderRow = rowStart >= launches.length;
              return (
                <div
                  key={vi.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${translateY}px)`,
                    paddingBottom: ROW_GAP,
                  }}
                >
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {isLoaderRow
                      ? Array.from({ length: columns }).map((_, i) => (
                          <LaunchCardSkeleton key={`skeleton-${i}`} />
                        ))
                      : rowLaunches.map((launch) => (
                          <LaunchCard key={launch.id} launch={launch} />
                        ))}
                  </div>
                </div>
              );
            })}
            {hasNextPage ? (
              <div
                ref={loadMoreSentinelRef}
                aria-hidden
                className="pointer-events-none absolute left-0 w-full"
                style={{
                  top: Math.max(0, totalSize - 2),
                  height: 2,
                }}
              />
            ) : null}
          </div>
          {isFetching && !isFetchingNextPage ? (
            <p className="text-center text-xs text-zinc-600">Refreshing…</p>
          ) : null}
          {!hasNextPage && launches.length > 0 ? (
            <p className="py-4 text-center text-xs text-zinc-600">You&apos;ve reached the end.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
