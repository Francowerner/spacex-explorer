import type { ZodType } from "zod";

const SPACEX_API_BASE = "https://api.spacexdata.com/v4";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  signal?: AbortSignal;
  revalidate?: number | false;
  cache?: RequestCache;
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

function computeBackoff(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const asNumber = Number(retryAfterHeader);
    if (Number.isFinite(asNumber) && asNumber > 0) return asNumber * 1000;
    const asDate = Date.parse(retryAfterHeader);
    if (!Number.isNaN(asDate)) {
      const diff = asDate - Date.now();
      if (diff > 0) return diff;
    }
  }
  const exponential = BASE_DELAY_MS * 2 ** attempt;
  const jitter = Math.random() * BASE_DELAY_MS;
  return exponential + jitter;
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    }
  });
}

async function fetchWithRetry(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal });
      if (response.ok) return response;
      if (!shouldRetry(response.status) || attempt === MAX_RETRIES) {
        throw new ApiError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status,
          url,
        );
      }
      const delay = computeBackoff(attempt, response.headers.get("retry-after"));
      await sleep(delay, signal);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if ((error as { name?: string }).name === "AbortError") throw error;
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await sleep(computeBackoff(attempt, null), signal);
    }
  }
  throw lastError ?? new Error(`Request failed after ${MAX_RETRIES} retries: ${url}`);
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${SPACEX_API_BASE}${path}`;
  const nextOptions: RequestInit & { next?: { revalidate?: number | false } } = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  };
  if (typeof options.revalidate !== "undefined") {
    nextOptions.next = { revalidate: options.revalidate };
  }
  if (options.cache) nextOptions.cache = options.cache;

  const response = await fetchWithRetry(url, nextOptions, options.signal);
  const json = (await response.json()) as unknown;
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid response shape from ${url}: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

export function apiGet<T>(path: string, schema: ZodType<T>, options?: RequestOptions): Promise<T> {
  return requestJson(path, { method: "GET" }, schema, options);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  return requestJson(path, { method: "POST", body: JSON.stringify(body) }, schema, options);
}
