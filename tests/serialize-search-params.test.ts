import { describe, expect, it } from "vitest";
import { searchParamsRecordToString } from "@/lib/serialize-search-params";

describe("searchParamsRecordToString", () => {
  it("returns empty for undefined or empty record", () => {
    expect(searchParamsRecordToString(undefined)).toBe("");
    expect(searchParamsRecordToString({})).toBe("");
  });

  it("sorts keys for stable output", () => {
    expect(
      searchParamsRecordToString({
        status: "past",
        from: "2019-01-01",
        sort: "name:asc",
      }),
    ).toBe("from=2019-01-01&sort=name%3Aasc&status=past");
  });
});
