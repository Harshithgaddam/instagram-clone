# Design Decisions — Mentor Checkpoint

## The question: one `posts` table, or split by kind?

### Option A (chosen): single `posts` table with `kind` discriminator

Originals, replies and reposts all live in `posts`, distinguished by
`kind` and an optional self-referencing `target_post_id`.

### Option B (rejected): separate `posts` / `comments` / `reposts` tables

Three tables: `posts` (originals only), `comments` (replies, with
`post_id` FK to `posts`), `reposts` (a thin join: `user_id` + `post_id`,
no own identity).

### Why Option A was chosen

1. **Replies need everything an original needs.** A reply has an author, a
   body, a `created_at`, likes, and — per the product brief — can itself be
   viewed in a "post detail" screen with its own like/reply counts. That's
   not a lightweight join row; it's a full post. Splitting it into
   `comments` means duplicating every column and every constraint
   (`body` length check, `author_id` FK, timestamp precision) in a second
   table.

2. **One cursor implementation instead of two.** The feed, profile
   timeline and reply list all paginate on `(created_at, id) DESC`. With
   Option A that's one query shape reused three ways (different `WHERE`
   filter, same `ORDER BY`/cursor logic). With Option B, `comments` would
   need its own independent pagination implementation, and any future
   feature that mixes originals and replies (e.g., a unified "activity"
   view) would have to `UNION` two differently-shaped tables.

3. **Reposts still need an identity.** A repost has to appear in the
   author's own timeline with its own `created_at` (a repost from today of
   a post from last month sorts by *today*), and needs to be countable /
   listable per user (use case 10). A thin join-only `reposts` table can
   do that, but at that point it already has `id`, `author_id`,
   `target_post_id`, `created_at` — i.e., it's already reinvented `posts`
   with a different name.

### Trade-off accepted

Option A means `body` and `target_post_id` are nullable and their
validity depends on `kind` — a rule a plain `CHECK` can partially express
(nullability combinations) but can't fully express (target must itself be
`kind = 'original'`). This is the one place normalization purists would
push back: a single table with conditionally-required columns is a mild
violation of "every column should be always-meaningful" 3NF spirit.

Accepted anyway, because the alternative (Option B) pays for that
avoided conditionality with duplicated schema, duplicated constraints,
and duplicated query logic across three tables — a worse trade for a
learning-scope project with one dev maintaining it. Documented here so the
mentor checkpoint has an explicit answer, not an implicit one.

---

## `reply_to_id` + `repost_of_id` (two columns) vs. one `target_post_id`

The first draft of this schema used a single `target_post_id`, reasoning
that "reply target" and "repost target" are the same *kind* of
relationship (self-reference to an original). After checking the existing
`Post` type in `backend/src/.../fixtures.ts`, the app already models these
as two separate optional fields: `replyToId` and `repostOfId`.

**Kept as two columns**, matching the app, because:

- The combined shape `CHECK` (see `data-dictionary.md`) ends up no more
  complex either way — it already branches on `kind`.
- PRD 04 will map this schema onto ORM entities. Naming DB columns after
  the fields the app *already* reads/writes means the entity class is a
  near-literal restatement of this table, not a remapping exercise.
- A single `target_post_id` would have saved one column, but at the cost
  of the app's repository/service layer needing a `kind`-based lookup to
  decide whether to read it into `replyToId` or `repostOfId` on the way
  out — an extra translation step for no real gain here.

## Other checkpoint-relevant decisions, briefly

- **UUID over serial IDs**: public identifiers should not leak insertion
  order or row counts (`/posts/1001` reveals total post volume). UUID v4
  via `gen_random_uuid()`.
- **`timestamptz(3)` over `timestamptz`/`date`**: millisecond precision is
  the deliberate policy — enough to deterministically break pagination
  ties with real, human-generated seed data, without needing to fabricate
  microsecond-distinct timestamps by hand in `seed.sql`.
- **No stored counters (`like_count` etc.)**: derived via `COUNT(*)` at
  query time (see `data-dictionary.md`, "Cross-cutting" section) — avoids
  the exact "cached counter can silently disagree with the source rows"
  failure mode the PRD calls out under 3NF.
- **`citext` for `handle` only**: the one column with a genuine
  case-insensitive uniqueness requirement. Not used elsewhere (e.g.
  `display_name`) since nothing else needs case-insensitive comparison.


## `post_media.images` shape

The `post_media.images` JSONB array stores the fixed image URLs and
accessibility text:

```json
{
  "small_url": "/fixtures/desk-480.jpg",
  "large_url": "/fixtures/desk-1200.jpg",
  "alt_text": "A desk with a laptop"
}
```

`width` and `height` are intentionally not stored in the image object.
The current profile grid establishes the displayed image dimensions and
aspect ratio in the frontend, so those database fields are not required
for the current presentation.

The array still contains 1–4 image objects, and the array index represents
the display position.
