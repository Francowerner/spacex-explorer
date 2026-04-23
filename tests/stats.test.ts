import { describe, expect, it } from "vitest";
import { aggregateByYear, computeOverall, type StatLaunch } from "@/lib/api/stats";

const launches: StatLaunch[] = [
  { date_utc: "2020-03-10T12:00:00.000Z", success: true, upcoming: false },
  { date_utc: "2020-07-20T12:00:00.000Z", success: false, upcoming: false },
  { date_utc: "2020-11-05T12:00:00.000Z", success: true, upcoming: false },
  { date_utc: "2021-01-15T12:00:00.000Z", success: true, upcoming: false },
  { date_utc: "2022-05-10T12:00:00.000Z", success: null, upcoming: true },
  { date_utc: "not-a-date", success: true, upcoming: false },
];

describe("aggregateByYear", () => {
  it("buckets by UTC year and ignores undateable rows", () => {
    const rows = aggregateByYear(launches);
    expect(rows.map((r) => r.year)).toEqual([2020, 2021, 2022]);
  });

  it("counts outcomes per year", () => {
    const rows = aggregateByYear(launches);
    const byYear = Object.fromEntries(rows.map((r) => [r.year, r]));
    expect(byYear[2020]).toMatchObject({ total: 3, success: 2, failure: 1, upcoming: 0 });
    expect(byYear[2021]).toMatchObject({ total: 1, success: 1, failure: 0, upcoming: 0 });
    expect(byYear[2022]).toMatchObject({ total: 1, success: 0, failure: 0, upcoming: 1 });
  });

  it("computes success rate excluding upcoming", () => {
    const rows = aggregateByYear(launches);
    const byYear = Object.fromEntries(rows.map((r) => [r.year, r]));
    expect(byYear[2020].successRate).toBe(67); // 2/3 rounded
    expect(byYear[2021].successRate).toBe(100);
    expect(byYear[2022].successRate).toBe(null); // only upcoming, no completed
  });

  it("is sorted ascending by year", () => {
    const shuffled: StatLaunch[] = [
      { date_utc: "2021-01-01T00:00:00Z", success: true, upcoming: false },
      { date_utc: "2019-01-01T00:00:00Z", success: true, upcoming: false },
      { date_utc: "2020-01-01T00:00:00Z", success: true, upcoming: false },
    ];
    expect(aggregateByYear(shuffled).map((r) => r.year)).toEqual([2019, 2020, 2021]);
  });
});

describe("computeOverall", () => {
  it("totals across all years and computes success rate", () => {
    const o = computeOverall(launches);
    expect(o.total).toBe(6);
    // success counts do not depend on a parseable date — computeOverall is date-agnostic.
    expect(o.success).toBe(4);
    expect(o.failure).toBe(1);
    expect(o.upcoming).toBe(1);
    // completed = 4 + 1 = 5, success = 4 → 80%
    expect(o.successRate).toBe(80);
  });

  it("returns null successRate when nothing is completed", () => {
    const o = computeOverall([
      { date_utc: "2025-01-01T00:00:00Z", success: null, upcoming: true },
    ]);
    expect(o.successRate).toBe(null);
  });
});
