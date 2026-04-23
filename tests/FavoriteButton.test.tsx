import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavoritesStore, type FavoriteLaunch } from "@/store/favorites";

const launch: FavoriteLaunch = {
  id: "launch-1",
  name: "Falcon Heavy Test",
  date_utc: "2018-02-06T20:45:00.000Z",
  success: true,
  upcoming: false,
  patchUrl: null,
  addedAt: 0,
};

describe("<FavoriteButton />", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: {} });
    window.localStorage.clear();
  });

  it("renders the inactive save label when the launch is not saved", () => {
    render(<FavoriteButton launch={launch} />);
    const button = screen.getByRole("button", {
      name: /save falcon heavy test to favorites/i,
    });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles to active after click and the store reflects it", async () => {
    const user = userEvent.setup();
    render(<FavoriteButton launch={launch} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(useFavoritesStore.getState().favorites["launch-1"]).toBeDefined();
    expect(
      await screen.findByRole("button", {
        name: /remove falcon heavy test from favorites/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("a second click removes it from the store", async () => {
    const user = userEvent.setup();
    render(<FavoriteButton launch={launch} />);
    const button = screen.getByRole("button");

    await user.click(button);
    await user.click(button);

    expect(useFavoritesStore.getState().favorites["launch-1"]).toBeUndefined();
  });
});
