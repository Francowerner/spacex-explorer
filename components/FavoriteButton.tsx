"use client";

import { useFavoritesStore, type FavoriteLaunch } from "@/store/favorites";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

type Props = {
  launch: FavoriteLaunch;
  className?: string;
  size?: "sm" | "md";
};

export function FavoriteButton({ launch, className, size = "md" }: Props) {
  const hydrated = useHydrated();
  const isFavorite = useFavoritesStore((s) => Boolean(s.favorites[launch.id]));
  const toggle = useFavoritesStore((s) => s.toggle);

  const active = hydrated && isFavorite;
  const label = active ? `Remove ${launch.name} from favorites` : `Save ${launch.name} to favorites`;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(launch);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors",
        "border-zinc-200 bg-white/90 text-zinc-600 hover:text-amber-500 hover:border-amber-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
        active && "text-amber-500 border-amber-400 bg-amber-50",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width={size === "sm" ? 16 : 20}
        height={size === "sm" ? 16 : 20}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
