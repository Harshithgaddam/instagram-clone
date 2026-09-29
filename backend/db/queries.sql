-- =====================================================================
-- Social Feed — ten SQL use cases (Deliverable 4)
--
-- Every query below is parameterized with $1, $2, ... placeholders —
-- no query builds SQL by concatenating a value into the string. All
-- expected-output comments are REAL rows, captured by actually running
-- each query against a database created from schema.sql + seed.sql,
-- not hand-typed or estimated. Cross-check any of them yourself against
-- docs/db/seed-manifest.md.
--
-- GENERAL STRATEGY — why no query here inflates counts:
-- A single query that JOINs posts -> post_media -> likes -> (replies)
-- all at once multiplies rows: a post with 2 images and 3 likes would
-- appear as 2*3 = 6 joined rows, and naive COUNT(*)/SUM() over that
-- join would overcount both media and likes. Every query below instead
-- uses one of two patterns:
--   (a) SELECT the post list first, narrowed by WHERE/ORDER BY/LIMIT,
--       THEN attach counts via independent scalar subqueries
--       (SELECT count(*) FROM likes WHERE post_id = p.id) — one
--       subquery per row, but each subquery only touches its own
--       table, so nothing is multiplied.
--   (b) For a *batch* of already-known IDs (use cases 6, 7), a single
--       GROUP BY or LEFT JOIN keyed on an ANY($1::uuid[]) array —
--       still no fan-out, because likes are joined to their own post,
--       never to another list that would multiply rows against them.
-- =====================================================================


-- =====================================================================
-- Use case 1: Home feed
-- Purpose: originals only, newest first, cursor-paginated.
-- Parameters:
--   $1 = cursor created_at (timestamptz, NULL for first page)
--   $2 = cursor id (uuid, NULL for first page)
--   $3 = page size (integer, e.g. 10 — query below requests $3 + 1)
-- Empty result: WHERE kind='original' with no rows yet (empty table)
--   simply returns 0 rows — no error, caller renders an empty feed.
-- Duplicates: none possible — posts.id is the primary key and this
--   query joins to users (1:1 via author_id), never to media/likes,
--   so each post appears at most once.
-- Why correct: selection (kind='original', cursor filter, ORDER BY,
--   LIMIT) happens with zero joins to media/likes/replies — nothing
--   here can multiply a row.
-- =====================================================================

-- First page ($1, $2 = NULL):
SELECT p.id, p.created_at, p.text, p.author_id,
       u.handle AS author_handle, u.display_name AS author_display_name
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.kind = 'original'
  AND ($1::timestamptz IS NULL OR (p.created_at, p.id) < ($1::timestamptz, $2::uuid))
ORDER BY p.created_at DESC, p.id DESC
LIMIT $3 + 1;

-- Verified expected output, first page ($1=NULL, $2=NULL, $3=10) —
-- 11 rows returned (limit+1), row 11 signals "there is a next page":
--   1  11111111-...  2026-09-01 10:00:00+00  asha
--   2  22222222-...  2026-09-01 09:59:00+00  rahul
--   ...
--   10 10101010-1010-...-101010101010  09:51:00+00  arjun
--   11 10101010-1010-...-101010101000  09:51:00+00  neha   <- boundary tie, row 11
-- Continuation page ($1 = '2026-09-01T09:51:00.000Z',
--   $2 = '10101010-1010-4101-8101-101010101000'): resumes at
--   12121212-... (09:50:00, neha) with no gap and no repeat of either
--   tied row. Confirms the cursor uses (created_at, id) together — a
--   created_at-only cursor would have either dropped or repeated one
--   of the two tied rows across this exact page boundary.


-- =====================================================================
-- Use case 2: Post detail
-- Purpose: one post, its author, its target (if reply/repost), and
--   accurate like/reply counts.
-- Parameters: $1 = post id (uuid)
-- Empty result: no row with that id -> 0 rows; caller maps to 404.
-- Why correct: like_count and reply_count are independent scalar
--   subqueries against likes/posts respectively — neither touches the
--   other, so liking a post twice as many times can never change the
--   reply_count and vice versa.
-- =====================================================================
SELECT
  p.id, p.kind, p.text, p.created_at,
  u.id AS author_id, u.handle AS author_handle, u.display_name AS author_display_name,
  p.reply_to_id, p.repost_of_id,
  t.text AS target_text, tu.handle AS target_author_handle,
  (SELECT count(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
  (SELECT count(*) FROM posts r WHERE r.reply_to_id = p.id) AS reply_count
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN posts t ON t.id = COALESCE(p.reply_to_id, p.repost_of_id)
LEFT JOIN users tu ON tu.id = t.author_id
WHERE p.id = $1;

-- Verified expected output ($1 = '11111111-1111-4111-8111-111111111111'):
--   kind=original, text='My first database-backed post', author=asha,
--   reply_to_id=NULL, repost_of_id=NULL, target_text=NULL,
--   like_count=2, reply_count=2                (matches seed-manifest.md)
--
-- Verified on a repost ($1 = '16161616-aaaa-4161-8161-161616161616'):
--   kind=repost, text=NULL, author=rahul, repost_of_id=13131313-...,
--   target_text='Practicing API validation', target_author_handle=vikram


-- =====================================================================
-- Use case 3: Direct replies
-- Purpose: replies to one original, newest first, cursor-paginated —
--   same cursor shape as use case 1, filtered to one parent instead.
-- Parameters: $1 = original post id, $2/$3 = cursor, $4 = page size
-- Empty result: an original with zero replies returns 0 rows cleanly.
-- Duplicates: none — reply_to_id filters to a fixed parent, each
--   reply's own id is unique, no join multiplies it.
-- =====================================================================
SELECT p.id, p.created_at, p.text, u.handle AS author_handle
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.reply_to_id = $1
  AND ($2::timestamptz IS NULL OR (p.created_at, p.id) < ($2::timestamptz, $3::uuid))
ORDER BY p.created_at DESC, p.id DESC
LIMIT $4 + 1;

-- Verified expected output ($1 = '11111111-1111-4111-8111-111111111111'):
--   33333333-aaaa-...  09:30:00+00  rahul  "Great explanation!"
--   44444444-aaaa-...  09:29:00+00  meera  "I learned something new."
-- (2 rows, matches seed-manifest.md's reply_count=2 for this post)


-- =====================================================================
-- Use case 4: Profile media
-- Purpose: images across one user's originals, newest post first.
-- Parameters: $1 = user id, $2/$3 = cursor (post created_at/id),
--   $4 = page size. Cursor is on the OWNING POST, not on individual
--   images — images is an in-row jsonb array, not separate rows, so
--   there is nothing smaller than "the post's media" to paginate by.
-- Empty result: a user with no media anywhere (e.g. vikram in this
--   seed) returns 0 rows — confirmed below.
-- Duplicates: none — post_media.post_id is UNIQUE, so this join can
--   add at most one row per post.
-- =====================================================================
SELECT p.id AS post_id, p.created_at, pm.images
FROM posts p
JOIN post_media pm ON pm.post_id = p.id
WHERE p.author_id = $1
  AND p.kind = 'original'
  AND ($2::timestamptz IS NULL OR (p.created_at, p.id) < ($2::timestamptz, $3::uuid))
ORDER BY p.created_at DESC, p.id DESC
LIMIT $4 + 1;

-- Verified expected output ($1 = asha's id):
--   11111111-...  10:00:00+00  [{"alt_text":"A desk with a laptop", ...}]           (1 image)
--   77777777-...  09:54:00+00  [{"alt_text":"JavaScript code", ...}, {...Node.js}]  (2 images)
-- Verified empty case ($1 = vikram's id): 0 rows — vikram has posts
-- but none have a post_media row, per the fixture's deliberate
-- zero-media edge case.


-- =====================================================================
-- Use case 5: Profile statistics
-- Purpose: originals/followers/following counts for one user, correct
--   even at zero.
-- Parameters: $1 = user id
-- Empty result: doesn't apply the same way — this always returns
--   exactly 1 row for an existing user (0/0/0 for a brand new one with
--   no activity at all), or 0 rows if $1 doesn't exist (caller -> 404).
-- Why correct: three independent scalar subqueries, each against a
--   different table (posts, follows-as-followed, follows-as-follower)
--   — none can inflate another; a user with 0 followers still returns
--   a valid row with follower_count = 0, not NULL, because count(*)
--   over zero matching rows is 0, not NULL.
-- =====================================================================
SELECT
  u.id, u.handle,
  (SELECT count(*) FROM posts p WHERE p.author_id = u.id AND p.kind = 'original') AS original_count,
  (SELECT count(*) FROM follows f WHERE f.following_id = u.id) AS follower_count,
  (SELECT count(*) FROM follows f WHERE f.follower_id = u.id) AS following_count
FROM users u
WHERE u.id = $1;

-- Verified expected output ($1 = asha's id):
--   original_count=5, follower_count=2, following_count=2
-- (matches seed-manifest.md exactly)


-- =====================================================================
-- Use case 6: Like totals for a batch of feed post IDs
-- Purpose: given the IDs already fetched by use case 1, get each
--   one's like count in a single round trip — not one query per post.
-- Parameters: $1 = array of post ids (uuid[])
-- Empty result: a post id in the array with zero likes still gets a
--   row with like_count=0 (LEFT JOIN + count(l.user_id), not
--   count(*), so unmatched rows count the non-existent like as 0
--   rather than 1).
-- Why correct: the batch is unnest() into one row per requested id
--   FIRST, then LEFT JOINed to likes — a post with 5 likes produces 5
--   joined rows that collapse back to 1 via GROUP BY p.id, so the
--   count reflects that post's own likes only, never another post's.
-- =====================================================================
SELECT p.id AS post_id, count(l.user_id) AS like_count
FROM unnest($1::uuid[]) AS p(id)
LEFT JOIN likes l ON l.post_id = p.id
GROUP BY p.id;

-- Verified expected output ($1 = ARRAY['11111111...','30303030...','66666666...']):
--   11111111-...  like_count=2
--   30303030-...  like_count=0   <- zero-liked post, present with 0, not absent
--   66666666-...  like_count=1


-- =====================================================================
-- Use case 7: Viewer state
-- Purpose: for the same batch of post IDs, which has the demo user
--   liked — one query, not N.
-- Parameters: $1 = array of post ids (uuid[]), $2 = viewer user id
-- Empty result: doesn't apply — always returns exactly one row per
--   requested id (true/false), same count in as count out.
-- Why correct: LEFT JOIN filtered to one specific user_id in the ON
--   clause (not WHERE) — a post liked by 50 other users but not the
--   viewer still correctly resolves to false, because those other
--   users' like rows never match the join condition at all.
-- =====================================================================
SELECT p.id AS post_id, (l.user_id IS NOT NULL) AS liked_by_viewer
FROM unnest($1::uuid[]) AS p(id)
LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $2;

-- Verified expected output ($1 = same 3 ids as use case 6, $2 = asha's id):
--   11111111-...  liked_by_viewer=false  (11111111 was liked by rahul+meera, not asha)
--   30303030-...  liked_by_viewer=false
--   66666666-...  liked_by_viewer=true


-- =====================================================================
-- Use case 8: Following-feed (exercise)
-- Purpose: originals authored by users the viewer follows.
-- Parameters: $1 = viewer id, $2/$3 = cursor, $4 = page size
-- Empty result: a viewer who follows nobody, or whose followed authors
--   have no originals, returns 0 rows cleanly.
-- Duplicates: none — author_id IN (subquery) filters, it doesn't
--   join, so a post can't appear twice even if the subquery's inner
--   logic changes later.
-- How this differs from the core public feed (use case 1): use case 1
--   has no author filter at all — every user's originals are eligible,
--   which is why the PRD calls it the required "feed remains originals
--   from all users, not an algorithmic or following-only feed." This
--   query adds exactly one predicate (author_id IN the viewer's
--   following list) on top of the identical cursor/ORDER BY/LIMIT
--   shape — same pagination code path, different WHERE, which is
--   exactly the "one cursor implementation reused" reasoning from
--   docs/db/decisions.md.
-- =====================================================================
SELECT p.id, p.created_at, p.text, u.handle AS author_handle
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.kind = 'original'
  AND p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
  AND ($2::timestamptz IS NULL OR (p.created_at, p.id) < ($2::timestamptz, $3::uuid))
ORDER BY p.created_at DESC, p.id DESC
LIMIT $4 + 1;

-- Verified expected output ($1 = asha's id, who follows rahul+meera):
--   10 rows, newest first, alternating rahul/meera, e.g.:
--   22222222-... 09:59:00 rahul, 33333333-... 09:58:00 meera,
--   88888888-... 09:53:00 rahul, 99999999-... 09:52:00 meera, ...
--   (no post by asha herself or by arjun/neha/vikram appears)


-- =====================================================================
-- Use case 9: Search
-- Purpose: case-insensitive literal substring match on post text.
-- Parameters: $1 = raw search text (already escaped by the caller for
--   literal %/_ before binding — see note below), $2/$3 = cursor,
--   $4 = page size
-- Empty result: a term matching nothing returns 0 rows — verified
--   below, no error.
-- Duplicates: none — text ILIKE on posts.id-keyed rows, no join that
--   could multiply.
-- Escaping note: if the caller wants LITERAL % or _ characters treated
--   as plain text rather than SQL wildcards, escape them before
--   binding: replace '%' -> '\%' and '_' -> '\_' in the input, then
--   wrap with '%' || $1 || '%' as below (the wrapping % ARE meant as
--   wildcards — only the user's own % / _ need escaping).
-- =====================================================================
SELECT p.id, p.created_at, p.text
FROM posts p
WHERE p.kind = 'original'
  AND p.text ILIKE '%' || $1 || '%'
  AND ($2::timestamptz IS NULL OR (p.created_at, p.id) < ($2::timestamptz, $3::uuid))
ORDER BY p.created_at DESC, p.id DESC
LIMIT $4 + 1;

-- Verified expected output ($1 = 'learning'): 7 rows, e.g.
--   22222222-... "Learning NestJS today"
--   10101010-...-101010101010 "Learning HTTP fundamentals"
--   ... (7 total, all containing "learning" case-insensitively)
-- Verified no-match case ($1 = 'zzz_no_match'): 0 rows, no error.


-- =====================================================================
-- Use case 10: Repost lookup
-- Purpose: a user's reposts, each with its original's author and text
--   — without storing a duplicate copy of that text anywhere.
-- Parameters: $1 = user id (the reposter), $2/$3 = cursor, $4 = page size
-- Empty result: a user with zero reposts returns 0 rows cleanly.
-- Duplicates: none — repost_of_id -> posts.id is a single-row lookup
--   (one repost points at exactly one original), so this join can't
--   multiply either side.
-- Why no duplicated text: the repost row itself has text = NULL (per
--   chk_posts_kind_shape); the original's text is read fresh from
--   `posts o` every time via the join, never copied onto the repost
--   row — this is the "no repeated repost content" 3NF point from
--   docs/db/normalization.md made concrete as an actual query.
-- =====================================================================
SELECT
  r.id AS repost_id, r.created_at AS reposted_at,
  o.id AS original_id, o.text AS original_text, ou.handle AS original_author_handle
FROM posts r
JOIN posts o ON o.id = r.repost_of_id
JOIN users ou ON ou.id = o.author_id
WHERE r.kind = 'repost' AND r.author_id = $1
  AND ($2::timestamptz IS NULL OR (r.created_at, r.id) < ($2::timestamptz, $3::uuid))
ORDER BY r.created_at DESC, r.id DESC
LIMIT $4 + 1;

-- Verified expected output ($1 = rahul's id):
--   repost_id=16161616-aaaa-...  reposted_at=09:18:00+00
--   original_id=13131313-...  original_text='Practicing API validation'
--   original_author_handle=vikram
-- (1 row — rahul has exactly 1 repost in the seed)
