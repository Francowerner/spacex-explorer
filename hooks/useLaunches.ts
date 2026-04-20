"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  queryLaunches,
  type LaunchesFilters,
  type LaunchesSort,
} from "@/lib/api/launches";

export type UseLaunchesArgs = {
  filters: LaunchesFilters;
  sort: LaunchesSort;
};

export function useLaunches({ filters, sort }: UseLaunchesArgs) {
  return useInfiniteQuery({
    queryKey: ["launches", filters, sort] as const,
    queryFn: ({ pageParam, signal }) =>
      queryLaunches({ page: pageParam, filters, sort, signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage ?? undefined : undefined),
  });
}
