import { beforeEach, describe, expect, it } from "vitest";
import { useFavoritesStore, type FavoriteLaunch } from "@/store/favorites";

function sample(id: string, overrides: Partial<FavoriteLaunch> = {}): FavoriteLaunch {
  return {
    id,
    name: `Mission ${id}`,
    date_utc: "2020-01-01T00:00:00.000Z",
    success: true,
    upcoming: false,
    patchUrl: null,
    addedAt: 0,
    ...overrides,
  };
}

describe("useFavoritesStore", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: {} });
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(useFavoritesStore.getState().favorites).toEqual({});
  });

  it("toggle adds a launch and stamps addedAt", () => {
    const before = Date.now();
    useFavoritesStore.getState().toggle(sample("abc"));
    const state = useFavoritesStore.getState();
    expect(state.favorites.abc).toBeDefined();
    expect(state.favorites.abc.id).toBe("abc");
    expect(state.favorites.abc.addedAt).toBeGreaterThanOrEqual(before);
  });

  it("toggle on an existing id removes it", () => {
    const { toggle } = useFavoritesStore.getState();
    toggle(sample("abc"));
    toggle(sample("abc"));
    expect(useFavoritesStore.getState().favorites).toEqual({});
  });

  it("toggle is independent per id", () => {
    const { toggle } = useFavoritesStore.getState();
    toggle(sample("a"));
    toggle(sample("b"));
    toggle(sample("a")); // removes a
    const favs = useFavoritesStore.getState().favorites;
    expect(favs.a).toBeUndefined();
    expect(favs.b).toBeDefined();
  });

  it("isFavorite reflects state", () => {
    const api = useFavoritesStore.getState();
    expect(api.isFavorite("x")).toBe(false);
    api.toggle(sample("x"));
    expect(useFavoritesStore.getState().isFavorite("x")).toBe(true);
  });

  it("remove deletes a single id and is a no-op when missing", () => {
    const { toggle, remove } = useFavoritesStore.getState();
    toggle(sample("a"));
    toggle(sample("b"));
    remove("a");
    remove("missing"); // no-op, should not throw
    const favs = useFavoritesStore.getState().favorites;
    expect(favs.a).toBeUndefined();
    expect(favs.b).toBeDefined();
  });

  it("clear wipes everything", () => {
    const { toggle, clear } = useFavoritesStore.getState();
    toggle(sample("a"));
    toggle(sample("b"));
    clear();
    expect(useFavoritesStore.getState().favorites).toEqual({});
  });
});
