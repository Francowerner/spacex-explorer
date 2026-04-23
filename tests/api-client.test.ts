import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiGet } from "@/lib/api/client";

const Schema = z.object({ ok: z.boolean() });

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("apiGet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns parsed data on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/ping", Schema)).resolves.toEqual({ ok: true });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 and eventually succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, { err: "boom" }))
      .mockResolvedValueOnce(jsonResponse(500, { err: "boom" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/ping", Schema)).resolves.toEqual({ ok: true });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 and respects numeric Retry-After", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}, { "retry-after": "2" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/ping", Schema)).resolves.toEqual({ ok: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2100);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after 3 retries on persistent 500 and throws ApiError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/ping", Schema)).rejects.toBeInstanceOf(ApiError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 + 3 retries
  });

  it("does not retry on 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/missing", Schema)).rejects.toMatchObject({ status: 404 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a shape error when the schema does not match", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { wrong: true }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(apiGet("/ping", Schema)).rejects.toThrow(/Invalid response shape/);
    await vi.runAllTimersAsync();
    await assertion;
  });
});
