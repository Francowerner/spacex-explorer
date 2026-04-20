"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FavoriteLaunch = {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  upcoming: boolean;
  patchUrl: string | null;
  addedAt: number;
};

type FavoritesState = {
  favorites: Record<string, FavoriteLaunch>;
  toggle: (launch: FavoriteLaunch) => void;
  remove: (id: string) => void;
  clear: () => void;
  isFavorite: (id: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      toggle: (launch) =>
        set((state) => {
          const next = { ...state.favorites };
          if (next[launch.id]) {
            delete next[launch.id];
          } else {
            next[launch.id] = { ...launch, addedAt: Date.now() };
          }
          return { favorites: next };
        }),
      remove: (id) =>
        set((state) => {
          if (!state.favorites[id]) return state;
          const next = { ...state.favorites };
          delete next[id];
          return { favorites: next };
        }),
      clear: () => set({ favorites: {} }),
      isFavorite: (id) => Boolean(get().favorites[id]),
    }),
    {
      name: "spacex-favorites",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
