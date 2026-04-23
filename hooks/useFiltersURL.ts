"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LaunchesFilters, LaunchesSort } from "@/lib/api/launches";
import {
  applyFiltersToParams,
  applySearchToParams,
  applySortToParams,
  parseFiltersFromParams,
  parseSortFromParams,
} from "@/lib/filters-url";

type FilterKey = "search" | "status" | "outcome" | "dateFrom" | "dateTo";

/**
 * URL is the single source of truth for filters + sort.
 *
 * Every mutator reads the *live* query string from `window.location.search`
 * rather than the React `searchParams` snapshot, so rapid consecutive edits
 * (e.g. user toggles status then sort before React re-renders) don't clobber
 * each other.
 *
 * `initialQueryStringFromServer` must come from the route `page` `searchParams`
 * so the SSR + first client paint match the real URL. Otherwise `useSearchParams`
 * can be empty on the server while the URL has filters, and React 19 hydration
 * leaves selects / date controls non-interactive after a full reload.
 */
export function useFiltersURL(initialQueryStringFromServer: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const liveQs = searchParams.toString();
  const queryString = hasHydrated ? liveQs : initialQueryStringFromServer;
  const filters = useMemo(
    () => parseFiltersFromParams(new URLSearchParams(queryString)),
    [queryString],
  );
  const sort = useMemo(
    () => parseSortFromParams(new URLSearchParams(queryString)),
    [queryString],
  );

  const queryStringRef = useRef(queryString);
  queryStringRef.current = queryString;

  const readLive = useCallback((): URLSearchParams => {
    if (typeof window === "undefined") return new URLSearchParams(queryStringRef.current);
    return new URLSearchParams(window.location.search);
  }, []);

  const replace = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    <K extends FilterKey>(key: K, value: LaunchesFilters[K] | undefined) => {
      const base = readLive();
      if (key === "search") {
        replace(applySearchToParams(base, (value as string | undefined) ?? ""));
        return;
      }
      const current = parseFiltersFromParams(base);
      const next = { ...current, [key]: value };
      replace(applyFiltersToParams(base, next));
    },
    [readLive, replace],
  );

  const setSort = useCallback(
    (next: LaunchesSort) => {
      replace(applySortToParams(readLive(), next));
    },
    [readLive, replace],
  );

  /**
   * Reset to the bare pathname (no query). Uses a real navigation so the address bar and
   * Next always match — `router.replace(pathname)` alone can fail to drop search params
   * after a full page load in some cases.
   */
  const clearAll = useCallback(() => {
    if (typeof window === "undefined") return;
    const base = pathname || "/";
    if (window.location.pathname === base && !window.location.search) return;
    window.location.replace(`${window.location.origin}${base}`);
  }, [pathname]);

  return { filters, sort, setFilter, setSort, clearAll };
}
