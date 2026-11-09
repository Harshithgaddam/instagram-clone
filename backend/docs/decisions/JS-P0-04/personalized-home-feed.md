# JS-P0-04 — Personalized Home Feed

## Route behavior

- `GET /feed` returns originals from the viewer and currently followed authors first, followed by originals from other enabled public authors. Disabled authors are excluded.
- If the viewer has no accepted follow to an enabled author, `GET /feed` still returns the viewer's originals and enabled public authors, and labels the mode as `public_fallback`.
- `GET /feed/public` preserves a public-only, all-authors listing for clients that need the V1 public feed. It uses the same cursor and limit contract and labels the response `public`.
- Replies and reposts are excluded from every group. Ordering is followed/viewer originals, then public non-followed originals; within each group ordering remains `(created_at DESC, id DESC)`. The opaque cursor carries the group so pagination can continue between groups without changing tuple ordering within either group.

## Consistency

Each request evaluates accepted follow relationships and author privacy/account state using current database state. A later request, including a request for the next cursor page, observes changes committed before its eligibility queries run. Pages are not a snapshot: follow or privacy changes between pages may cause posts to appear or disappear, and completeness across those changes is not guaranteed.

## Proposed budgets and measurement status

Initial targets proposed before implementation:

- p95 endpoint latency below 300 ms.
- At most 2 SQL statements per request.

These targets are not verified. Feed selection currently uses a follow-existence query plus a page query, and response hydration performs additional per-item repository reads. The existing query-plan report covers a 46-post seed dataset, which is not representative for this endpoint. A benchmark against a larger representative dataset, including full response hydration, is required before claiming either target. Query-count reduction may be needed to meet the 2-statement target.