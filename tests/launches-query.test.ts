import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryLaunches } from "@/lib/api/launches";

function pageResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      docs: [],
      totalDocs: 0,
      limit: 20,
      totalPages: 0,
      page: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
      ...overrides,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

type CapturedCall = { url: string; body: Record<string, unknown> };

function captureFetch(): { calls: CapturedCall[]; spy: ReturnType<typeof vi.fn> } {
  const calls: CapturedCall[] = [];
  const spy = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      body: init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : {},
    });
    return pageResponse();
  });
  vi.stubGlobal("fetch", spy);
  return { calls, spy };
}

describe("queryLaunches → request body mapping", () => {
  beforeEach(() => {
    // no fake timers — we just want deterministic fetch capture.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the expected shape for the default (no filters) query", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 1,
      filters: { status: "all", outcome: "all" },
      sort: { field: "date_utc", direction: "desc" },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.spacexdata.com/v4/launches/query");
    expect(calls[0].body).toEqual({
      query: {},
      options: {
        page: 1,
        limit: 20,
        sort: { date_utc: -1, flight_number: -1 },
        select: expect.any(Array),
      },
    });
  });

  it("maps search term to a case-insensitive regex on name", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 1,
      filters: { search: "  Starlink  " },
      sort: { field: "date_utc", direction: "desc" },
    });
    const query = (calls[0].body as { query: Record<string, unknown> }).query;
    expect(query.name).toEqual({ $regex: "Starlink", $options: "i" });
  });

  it("maps status to the upcoming boolean", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 2,
      filters: { status: "upcoming" },
      sort: { field: "name", direction: "asc" },
    });
    const body = calls[0].body as { query: Record<string, unknown>; options: Record<string, unknown> };
    expect(body.query).toEqual({
      upcoming: true,
      date_utc: { $gte: expect.any(String) },
    });
    expect(body.options.page).toBe(2);
    expect(body.options.sort).toEqual({ name: 1, flight_number: -1 });
  });

  it("maps status=past to completed launches in the past", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 1,
      filters: { status: "past" },
      sort: { field: "date_utc", direction: "desc" },
    });
    const query = (calls[0].body as { query: Record<string, unknown> }).query as {
      upcoming: boolean;
      date_utc: { $lte: string };
    };
    expect(query.upcoming).toBe(false);
    expect(query.date_utc.$lte).toEqual(expect.any(String));
  });

  it("maps outcome=failure to success:false", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 1,
      filters: { outcome: "failure" },
      sort: { field: "date_utc", direction: "desc" },
    });
    const query = (calls[0].body as { query: Record<string, unknown> }).query;
    expect(query).toEqual({ success: false, upcoming: false });
  });

  it("maps date range to $gte/$lte ISO on date_utc", async () => {
    const { calls } = captureFetch();
    await queryLaunches({
      page: 1,
      filters: { dateFrom: "2020-01-01", dateTo: "2020-12-31" },
      sort: { field: "date_utc", direction: "desc" },
    });
    const query = (calls[0].body as { query: Record<string, unknown> }).query as {
      date_utc: { $gte: string; $lte: string };
    };
    expect(query.date_utc.$gte).toBe("2020-01-01T00:00:00.000Z");
    expect(query.date_utc.$lte).toBe("2020-12-31T23:59:59.999Z");
  });
});
