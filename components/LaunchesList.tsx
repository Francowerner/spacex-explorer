"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLaunches } from "@/hooks/useLaunches";
import { useDebounce } from "@/hooks/useDebounce";
import type { LaunchesFilters, LaunchesSort } from "@/lib/api/launches";
import type { Launch } from "@/lib/api/schemas";
import {
  applyFiltersToParams,
  applySearchToParams,
  applySortToParams,
  parseFiltersFromParams,
  parseSortFromParams,
} from "@/lib/filters-url";
import { LaunchCard } from "./LaunchCard";
import { LaunchCardSkeleton } from "./Skeletons";
import { ErrorState, EmptyState } from "./ErrorState";
import { FiltersBar } from "./FiltersBar";

const CARD_ESTIMATED_HEIGHT = 148;

export function LaunchesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);
  const sort = useMemo(() => parseSortFromParams(searchParams), [searchParams]);

  const urlSearch = filters.search ?? "";
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
  if (lastUrlSearch !== urlSearch) {
    setLastUrlSearch(urlSearch);
    setSearchDraft(urlSearch);
  }

  const debouncedSearch = useDebounce(searchDraft, 350);

  const replaceParams = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    replaceParams(applySearchToParams(searchParams, debouncedSearch));
  }, [debouncedSearch, urlSearch, searchParams, replaceParams]);

  const handleFiltersChange = useCallback(
    (next: LaunchesFilters) => {
      replaceParams(applyFiltersToParams(searchParams, next));
    },
    [searchParams, replaceParams],
  );

  const handleSortChange = useCallback(
    (next: LaunchesSort) => {
      replaceParams(applySortToParams(searchParams, next));
    },
    [searchParams, replaceParams],
  );

  const effectiveFilters = useMemo<LaunchesFilters>(
    () => ({ ...filters, search: debouncedSearch.trim() || undefined }),
    [filters, debouncedSearch],
  );

  const query = useLaunches({ filters: effectiveFilters, sort });
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

  const parentRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useEffect(() => {
    if (!parentRef.current) return;
    setScrollMargin(parentRef.current.offsetTop);
    const onResize = () => {
      if (parentRef.current) setScrollMargin(parentRef.current.offsetTop);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: launches.length + (hasNextPage ? 3 : 0),
    estimateSize: () => CARD_ESTIMATED_HEIGHT,
    overscan: 6,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastItem) return;
    if (lastItem.index >= launches.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [lastItem, launches.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar
        filters={filters}
        sort={sort}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        totalResults={totalResults}
      />

      {status === "pending" ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading launches">
          {Array.from({ length: 6 }).map((_, i) => (
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
              height: `${virtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((vi) => {
              const launch = launches[vi.index];
              const translateY = vi.start - virtualizer.options.scrollMargin;
              return (
                <div
                  key={vi.key}
                  ref={virtualizer.measureElement}
                  data-index={vi.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${translateY}px)`,
                    paddingBottom: 12,
                  }}
                >
                  {launch ? <LaunchCard launch={launch} /> : <LaunchCardSkeleton />}
                </div>
              );
            })}
          </div>
          {isFetching && !isFetchingNextPage ? (
            <p className="text-center text-xs text-zinc-500">Refreshing…</p>
          ) : null}
          {!hasNextPage && launches.length > 0 ? (
            <p className="py-4 text-center text-xs text-zinc-500">You&apos;ve reached the end.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
