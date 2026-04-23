import type { Metadata } from "next";
import { FavoritesClient } from "./favorites-client";

export const metadata: Metadata = {
  title: "Favorites · SpaceX Explorer",
  description: "Launches you've saved for later.",
};

export default function FavoritesPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-zinc-600">
          Your saved launches. Persisted locally in your browser.
        </p>
      </div>
      <FavoritesClient />
    </div>
  );
}
