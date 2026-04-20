"use client";

import { useSyncExternalStore } from "react";
import { useFavoritesStore } from "@/store/favorites";

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useFavoritesStore.persist.onFinishHydration(cb),
    () => useFavoritesStore.persist.hasHydrated(),
    () => false,
  );
}
