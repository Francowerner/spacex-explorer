import { describe, expect, it } from "vitest";
import {
  applyFiltersToParams,
  applySearchToParams,
  applySortToParams,
  parseFiltersFromParams,
  parseSortFromParams,
} from "@/lib/filters-url";

describe("parseFiltersFromParams", () => {
  it("defaults to all/any when nothing is set", () => {
    const filters = parseFiltersFromParams(new URLSearchParams());
    expect(filters).toEqual({
      search: undefined,
      status: "all",
      outcome: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
  });

  it("maps recognised values through", () => {
    const sp = new URLSearchParams(
      "q=starlink&status=upcoming&outcome=failure&from=2020-01-01&to=2021-01-01",
    );
    expect(parseFiltersFromParams(sp)).toEqual({
      search: "starlink",
      status: "upcoming",
      outcome: "failure",
      dateFrom: "2020-01-01",
      dateTo: "2021-01-01",
    });
  });

  it("ignores unknown status/outcome values", () => {
    const sp = new URLSearchParams("status=bogus&outcome=maybe");
    const filters = parseFiltersFromParams(sp);
    expect(filters.status).toBe("all");
    expect(filters.outcome).toBe("all");
  });
});

describe("parseSortFromParams", () => {
  it("defaults to date_utc desc", () => {
    expect(parseSortFromParams(new URLSearchParams())).toEqual({
      field: "date_utc",
      direction: "desc",
    });
  });

  it("parses name:asc", () => {
    expect(parseSortFromParams(new URLSearchParams("sort=name:asc"))).toEqual({
      field: "name",
      direction: "asc",
    });
  });

  it("falls back on malformed input", () => {
    expect(parseSortFromParams(new URLSearchParams("sort=garbage"))).toEqual({
      field: "date_utc",
      direction: "desc",
    });
  });
});

describe("apply*ToParams", () => {
  it("applyFiltersToParams only writes non-default keys", () => {
    const next = applyFiltersToParams(new URLSearchParams(), {
      status: "past",
      outcome: "all",
      dateFrom: "2020-01-01",
      dateTo: undefined,
    });
    expect(next.get("status")).toBe("past");
    expect(next.has("outcome")).toBe(false);
    expect(next.get("from")).toBe("2020-01-01");
    expect(next.has("to")).toBe(false);
  });

  it("applyFiltersToParams clears previous values when reset", () => {
    const base = new URLSearchParams("status=upcoming&from=2020-01-01");
    const next = applyFiltersToParams(base, {
      status: "all",
      outcome: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
    expect(next.has("status")).toBe(false);
    expect(next.has("from")).toBe(false);
  });

  it("applySortToParams omits the default to keep the URL clean", () => {
    const def = applySortToParams(new URLSearchParams(), {
      field: "date_utc",
      direction: "desc",
    });
    expect(def.has("sort")).toBe(false);

    const custom = applySortToParams(new URLSearchParams(), {
      field: "name",
      direction: "asc",
    });
    expect(custom.get("sort")).toBe("name:asc");
  });

  it("applySearchToParams trims and removes empty strings", () => {
    const p1 = applySearchToParams(new URLSearchParams(), "  hello  ");
    expect(p1.get("q")).toBe("hello");

    const p2 = applySearchToParams(new URLSearchParams("q=old"), "   ");
    expect(p2.has("q")).toBe(false);
  });
});

describe("round-trip", () => {
  it("parse → apply yields a stable URL", () => {
    const sp = new URLSearchParams("q=starlink&status=past&sort=name:asc");
    const filters = parseFiltersFromParams(sp);
    const sort = parseSortFromParams(sp);

    let next = applyFiltersToParams(new URLSearchParams(), filters);
    next = applySortToParams(next, sort);
    next = applySearchToParams(next, filters.search ?? "");

    // Compare as sets — key order is not meaningful.
    expect(next.get("q")).toBe("starlink");
    expect(next.get("status")).toBe("past");
    expect(next.get("sort")).toBe("name:asc");
  });
});
