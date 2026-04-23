# SpaceX Explorer

Next.js 16 (App Router), React 19, TypeScript strict, TanStack Query, Zustand. Public SpaceX API v4 — server-side list filters/pagination, launch detail, favourites, optional stats/compare and offline-friendly caching.

---

## How to run

Node 20+ and `pnpm`. No env vars.

```bash
pnpm install && pnpm dev   # http://localhost:3000
pnpm build && pnpm lint && pnpm test
pnpm exec tsc --noEmit
```

---

## Architecture (brief: App vs Pages, React Query vs SWR/custom)

- **App Router** — Detail route (`/launches/[id]`) is an RSC: launch + rocket + launchpad fetched on the server in parallel. Home is a light RSC shell + client island (`LaunchesList`) for filters, infinite list, and virtualization. **Pages Router** would work; App Router matches current Next practice and keeps data-fetching on the server where it helps.
- **TanStack Query** — `useInfiniteQuery` for the list; `queryKey` includes filters and sort so each combination is cached separately. Not SWR; not “raw fetch in components”. A thin **`fetch` layer** ([`lib/api/client.ts`](lib/api/client.ts)) adds Zod parsing, typed errors, and **retry/backoff** for `429` / `5xx` (plus `Retry-After`). Query defaults in [`lib/query-client.ts`](lib/query-client.ts) add a second line of retry/delay where appropriate.
- **Zod** at API boundaries ([`lib/api/schemas.ts`](lib/api/schemas.ts)). **Zustand + persist** for favourites ([`store/favorites.ts`](store/favorites.ts)).
- **Shareable list URL** — Filters and sort live in the query string via [`hooks/useFiltersURL.ts`](hooks/useFiltersURL.ts) + [`lib/filters-url.ts`](lib/filters-url.ts); search uses a short debounce before writing to the URL so typing doesn’t spam history.

---

## SpaceX API — queries and pagination

List data uses **only** `POST /launches/query` (no “download all and filter in the browser”). Body built in [`lib/api/launches.ts`](lib/api/launches.ts): Mongo-style filters (`upcoming`, `success`, `date_utc`, name `$regex`), **`options.page` / `limit`**, sort (with `flight_number` for stable pages), and **`select`** to shrink payloads. Detail uses GET `/launches/:id`, `/rockets/:id`, `/launchpads/:id`.

---

## Performance & accessibility (brief)

- **Performance** — Window virtualizer for the card grid; fixed row sizing from layout width to avoid layout thrash; debounced search; `next/image` + `remotePatterns` where useful; memoised cards and narrow Zustand selectors; list projection on the API.
- **Accessibility** — Landmarks, skip link, labels / `aria-*` on controls and live regions for result counts, visible focus, reduced-motion for decorative animation.

---

## Tradeoffs & next steps

- **Timebox** — No Playwright e2e, no i18n, no full design-system docs. Would add smoke e2e, optional `nuqs`-style URL helpers, and monitoring on parse errors in a product.
- **Data** — The public API dataset is effectively frozen; some “upcoming” rows or media are stale — handled with empty states and placeholders.

---

## Known limitations

- List and rich interactions assume JS (React Query + client list).
- Native date inputs: formatting depends on the browser/locale.
- Image hosts vary; optimisation is limited to configured `remotePatterns`.
