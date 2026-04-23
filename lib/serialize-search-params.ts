/**
 * Stable query string from Next.js `page` `searchParams` so the server render and
 * the client's first hydrated paint agree (avoids broken form controls).
 */
export function searchParamsRecordToString(
  record: Record<string, string | string[] | undefined> | undefined,
): string {
  if (!record) return "";
  const keys = Object.keys(record).sort();
  if (keys.length === 0) return "";
  const p = new URLSearchParams();
  for (const key of keys) {
    const raw = record[key];
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      p.append(key, v);
    }
  }
  return p.toString();
}
