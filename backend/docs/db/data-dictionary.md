# Data Dictionary — Social Feed

Conventions decided up front (applies to every table below):

- **Public identifiers:** `uuid`, generated with `gen_random_uuid()` (from
  `pgcrypto`, or native `gen_random_uuid()` on PG 13+). No sequential
  integer IDs are exposed in the API.
- **Timestamps:** `timestamptz(3)` everywhere (millisecond precision, UTC
  on the wire). Millisecond precision is enough to break feed pagination
  ties deterministically alongside `id`, without the noise of microsecond
  precision in seed/test data.
- **User-facing text:** `citext` for the handle (case-insensitive
  uniqueness "for free"); `text` for everything else, with `CHECK` for
  length where the product rule requires it (Postgres `text` has no
  performance reason to prefer `varchar(n)`).
- **Booleans/enums:** `kind` is modeled as `text` + `CHECK (kind IN (...))`
  rather than a Postgres `ENUM` type, so adding a future kind doesn't
  require an `ALTER TYPE` migration.

---

## `users`

| Column | Meaning | Type | Null? | Default | Key/Constraint | Example |
|---|---|---|---|---|---|---|
| `id` | Public identifier | `uuid` | not null | `gen_random_uuid()` | PK | `3f2e...` |
| `handle` | Unique login/mention name | `citext` | not null | — | `UNIQUE`; `CHECK (handle ~ '^[a-z0-9_]{3,20}$')` | `demo_user` |
| `display_name` | Shown on profile/posts | `text` | not null | — | `CHECK (char_length(display_name) BETWEEN 1 AND 50)` | `Demo User` |
| `bio` | Short profile description | `text` | null | `NULL` | `CHECK (bio IS NULL OR char_length(bio) <= 160)` | `Frontend developer` |
| `avatar_small_url` | Small avatar variant (feed/list views) | `text` | null | `NULL` | — | `/fixtures/asha-48.jpg` |
| `avatar_large_url` | Large avatar variant (profile view) | `text` | null | `NULL` | — | `/fixtures/asha-96.jpg` |
| `created_at` | Account creation time | `timestamptz(3)` | not null | `now()` | — | `2026-01-04 09:00:00.000+00` |

**Why two URL columns instead of a JSON `avatar` object?** The fixture
models avatar as `{ smallUrl, largeUrl }` — a fixed two-variant shape, not
an open-ended list. Two plain `text` columns keep it queryable/constrainable
(`NOT NULL` per column if ever required) without reaching for `jsonb` for a
shape that never varies in size. `post_media` below has the same reasoning
for `small_url`/`large_url`.

**Why `citext` + a lowercase `CHECK` together?** `citext` gives
case-insensitive *comparison* (`WHERE handle = 'Demo_User'` matches
`demo_user`), but it doesn't stop someone inserting `Demo_User` with mixed
case stored on disk. The regex `CHECK` enforces the *storage* policy: what's
actually on disk is always lowercase, so `ORDER BY handle` and display logic
never have to re-normalize.

---

## `posts`

| Column | Meaning | Type | Null? | Default | Key/Constraint | Example |
|---|---|---|---|---|---|---|
| `id` | Public identifier | `uuid` | not null | `gen_random_uuid()` | PK | `a1b2...` |
| `author_id` | Who wrote/reposted it | `uuid` | not null | — | FK → `users(id)` | `3f2e...` |
| `kind` | Discriminator | `text` | not null | — | `CHECK (kind IN ('original','reply','repost'))` | `reply` |
| `reply_to_id` | Original being replied to | `uuid` | null (required iff `kind = 'reply'`) | `NULL` | FK → `posts(id)`; see combined `CHECK` below | `a1b2...` |
| `repost_of_id` | Original being reposted | `uuid` | null (required iff `kind = 'repost'`) | `NULL` | FK → `posts(id)`; see combined `CHECK` below | `a1b2...` |
| `text` | Post text | `text` | null (required for original/reply, null for repost) | `NULL` | see combined `CHECK` below | `hello feed!` |
| `created_at` | Post time | `timestamptz(3)` | not null | `now()` | — | `2026-01-04 09:05:12.500+00` |

**Column name matches the fixture/app, not the earlier `body` draft.** The
existing `Post` type in `fixtures.ts` uses `text`, `authorId`, `replyToId`
and `repostOfId` — this dictionary now uses the same names (snake_case) so
the future TypeORM/Prisma entity maps onto the table with minimal renaming.

**Combined shape `CHECK`,** one constraint covering all three `kind`s:
```sql
ALTER TABLE posts ADD CONSTRAINT chk_post_kind_shape CHECK (
  (kind = 'original' AND reply_to_id IS NULL AND repost_of_id IS NULL
     AND char_length(text) BETWEEN 1 AND 280)
  OR
  (kind = 'reply' AND reply_to_id IS NOT NULL AND repost_of_id IS NULL
     AND char_length(text) BETWEEN 1 AND 280)
  OR
  (kind = 'repost' AND repost_of_id IS NOT NULL AND reply_to_id IS NULL
     AND text IS NULL)
);
```

**What this `CHECK` cannot verify:** that the row pointed to by
`reply_to_id`/`repost_of_id` is itself `kind = 'original'` (no
reply-to-a-reply, no repost-of-a-repost). A `CHECK` can't subquery another
row in Postgres. That rule is enforced in the service layer at write time —
flagged explicitly in `decisions.md` and re-tested in
`constraint-tests.sql` as a documented *application* guarantee, not a
database one.

**No-double-repost rule:** enforced with a **partial unique index**, not a
plain `UNIQUE`, since it only applies when `kind = 'repost'`:
```sql
CREATE UNIQUE INDEX uq_one_repost_per_user
  ON posts (author_id, repost_of_id)
  WHERE kind = 'repost';
```

---

## `post_media`

| Column | Meaning | Type | Null? | Default | Key/Constraint | Example |
|---|---|---|---|---|---|---|
| `id` | Public identifier | `uuid` | not null | `gen_random_uuid()` | PK | `c9d8...` |
| `post_id` | Owning post (must be an original) | `uuid` | not null | — | FK → `posts(id)`; `UNIQUE` | `a1b2...` |
| `images` | Images belonging to the post | `jsonb` | not null | — | `CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) BETWEEN 1 AND 4)` | `[{"small_url":"/fixtures/desk-480.jpg","large_url":"/fixtures/desk-1200.jpg","alt_text":"A desk with a laptop"}]` |

Each `post_media` row represents one original post. The `images` column
contains an array of 1–4 image objects. The array index is the display
position, so no separate `position` column is required.

Each image object has this shape:

```json
{
  "small_url": "/fixtures/desk-480.jpg",
  "large_url": "/fixtures/desk-1200.jpg",
  "alt_text": "A desk with a laptop"
}
```

`width` and `height` are intentionally not stored in the image object.
The frontend controls the displayed image dimensions/aspect ratio, so these
fields are not required by the current media model.

**Why one `post_media` row per post?** The PRD allows 0–4 images per
original post. Keeping the images together in one `jsonb` array makes the
array itself represent the ordered media collection: index 0 is the first
image and index 3 is the fourth image. A post with no images simply has no
`post_media` row.

**Service-layer validation:** each image object must contain non-empty
`small_url`, `large_url`, and `alt_text`. The database can validate that
`images` is an array containing 1–4 objects, while element-level validation
is performed by the service layer.

---

## `likes`

| Column | Meaning | Type | Null? | Default | Key/Constraint | Example |
|---|---|---|---|---|---|---|
| `user_id` | Who liked | `uuid` | not null | — | PK (composite), FK → `users(id)` | `3f2e...` |
| `post_id` | What was liked | `uuid` | not null | — | PK (composite), FK → `posts(id)` | `a1b2...` |
| `created_at` | Like time | `timestamptz(3)` | not null | `now()` | — | `2026-01-04 09:10:00.000+00` |

No surrogate `id` here — the composite PK `(user_id, post_id)` *is* the
uniqueness rule ("like once"), so a separate ID column would only add an
unused index. This is the "surrogate ID on association rows" question the
PRD asks about answered directly: **not needed** for `likes` or `follows`,
because nothing else ever needs to reference a single like/follow row by
itself (no "edit a like" concept exists), and the natural composite key is
already exactly the constraint we want.

---

## `follows`

| Column | Meaning | Type | Null? | Default | Key/Constraint | Example |
|---|---|---|---|---|---|---|
| `follower_id` | Who is following | `uuid` | not null | — | PK (composite), FK → `users(id)` | `3f2e...` |
| `following_id` | Who is being followed | `uuid` | not null | — | PK (composite), FK → `users(id)` | `9a7c...` |

Named `following_id` (not `followed_id`) to match the fixture's
`followingId` field exactly.
| `created_at` | Follow time | `timestamptz(3)` | not null | `now()` | — | `2026-01-04 09:12:00.000+00` |

`CHECK (follower_id <> followed_id)` blocks self-follow at the row level —
this one *is* a same-row check, so a plain `CHECK` is correct here (unlike
the media/target-kind rules above, which need other rows).

---

## Cross-cutting: counts are never stored

`like_count`, `reply_count`, `follower_count`, `following_count` do **not**
appear as columns anywhere in this dictionary. Per the PRD's normalization
requirement, they're always derived with `COUNT(*)` at query time (see
`queries.sql`, use cases 2, 5, 6). This is revisited only if a query-plan
report later shows real load justifying a maintained counter — out of core
scope now.
