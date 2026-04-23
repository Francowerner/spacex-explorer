import { describe, expect, it } from "vitest";
import { formatYmdTyping } from "@/lib/date-ymd-input";

describe("formatYmdTyping", () => {
  it("caps digits at 8 and inserts dashes", () => {
    expect(formatYmdTyping("")).toBe("");
    expect(formatYmdTyping("2020")).toBe("2020");
    expect(formatYmdTyping("202001")).toBe("2020-01");
    expect(formatYmdTyping("20200115")).toBe("2020-01-15");
    expect(formatYmdTyping("2020011500")).toBe("2020-01-15");
  });

  it("strips non-digits", () => {
    expect(formatYmdTyping("20xx20-01-15")).toBe("2020-01-15");
  });
});
