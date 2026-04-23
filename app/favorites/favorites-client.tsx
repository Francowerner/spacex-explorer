"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useFavoritesStore } from "@/store/favorites";
import { useHydrated } from "@/hooks/useHydrated";
import { formatLaunchDate } from "@/lib/format";
import { EmptyState } from "@/components/ErrorState";

export function FavoritesClient() {
  const hydrated = useHydrated();
  const favorites = useFavoritesStore((s) => s.favorites);
  const remove = useFavoritesStore((s) => s.remove);
  const clear = useFavoritesStore((s) => s.clear);

  const items = useMemo(
    () => Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt),
    [favorites],
  );

  if (!hydrated) {
    return (
      <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-zinc-100" />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        message="Save launches from the list or detail pages — they will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">{items.length} saved</p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Remove all favorites?")) clear();
          }}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Clear all
        </button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((fav) => (
          <li
            key={fav.id}
            className="relative rounded-xl border border-zinc-200 bg-white p-4"
          >
            <Link
              href={`/launches/${fav.id}`}
              className="flex gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {fav.patchUrl ? (
                  <Image
                    src={fav.patchUrl}
                    alt={`${fav.name} mission patch`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs font-medium text-zinc-800">
                    No patch
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="truncate font-semibold">{fav.name}</h2>
                <p className="text-xs text-zinc-600">
                  <time dateTime={fav.date_utc}>{formatLaunchDate(fav.date_utc)}</time>
                </p>
                <p className="text-xs text-zinc-600">
                  Saved {new Date(fav.addedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => remove(fav.id)}
              aria-label={`Remove ${fav.name} from favorites`}
              className="absolute right-2 top-2 rounded-md border border-zinc-200 px-2 py-1 text-xs hover:border-rose-300 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
