# Normalization — 1NF through 3NF in this schema's terms

## 1NF — every column holds one atomic value

The naive array-of-Post-objects design breaks this immediately: a post
with `likedBy: ['asha', 'rahul']` or a user with
`followers: ['rahul', 'meera']` stores a *list* inside one field. You
can't index into it, can't enforce "once per user" on it, and can't join
it efficiently.

This schema never does that:

- **No comma-separated/array likes or followers.** `likes` and `follows`
  are their own tables, one row per fact. "Who liked post X" is
  `SELECT user_id FROM likes WHERE post_id = X`, not a string split.
- **Media variants are two named columns (`small_url`, `large_url`),
  not a list.** The PRD explicitly allows this — a *list* of arbitrary
  variants would need its own table, but a fixed pair of two is still one
  atomic fact per column.

## 2NF — every non-key column depends on the *whole* key

2NF only bites where a table has a **composite** primary key — here,
`likes (user_id, post_id)` and `follows (follower_id, following_id)`.

- `likes.created_at` depends on the *pair* — "when this specific user
  liked this specific post" — not on `user_id` alone (that would be "when
  this user joined liking things," meaningless) or `post_id` alone. No
  partial dependency exists because there's nothing on either table that
  depends on only half the key.
- Contrast with what a violation would look like: if `likes` also stored
  `post_author_handle`, that column would depend only on `post_id` (via
  `posts.author_id` → `users.handle`), not on the full `(user_id,
  post_id)` pair — a partial dependency, and a 2NF violation. This schema
  doesn't do that; if you need the author's handle for a like, join out
  to `posts` → `users`.

## 3NF — no non-key column depends on another non-key column (no transitive dependency)

This is where "denormalize for convenience" temptations usually live, and
where the PRD's specific examples map directly:

- **No copied author profile on every post.** `posts` stores
  `author_id`, not `author_handle`/`author_display_name`. If it stored
  the handle directly, that column would depend on `author_id` (a
  non-key column) rather than on `posts.id` (the key) — transitive,
  and it goes stale the moment a user renames.
- **No repeated repost content.** A repost row has no `text` at all
  (enforced by `chk_posts_kind_shape`) and no copy of the original's
  text — just `repost_of_id`. The original's text is reached by joining,
  never duplicated.
- **No stored count that can silently disagree with association rows.**
  `like_count`, `reply_count`, `follower_count`, `following_count` don't
  exist as columns anywhere. If `posts.like_count` existed, it would
  depend on `posts.id` only insofar as it's a derived aggregate of
  `likes` rows — the classic case where the "non-key column" (the count)
  really depends on a *different table's rows*, not on this table's key
  at all. Every count in this schema is `COUNT(*)` at query time (see
  `queries.sql` for the actual query shapes) — always correct because
  there's only one place the underlying fact lives.

## Where this schema deliberately stops short of "purer" normalization

- `post_media.small_url`/`large_url` as two fixed columns is *not* fully
  normalized in the strictest sense — a `post_media_variants(media_id,
  variant_name, url)` table would let you add a third size without a
  schema change. The PRD explicitly calls this acceptable for now
  ("a few fixed URL variants on a media row are acceptable here; a
  separate variant table is an optional richer model, not a
  prerequisite") — noted here so it's a documented trade-off, not an
  oversight.
