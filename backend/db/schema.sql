-- =====================================================================
-- Social Feed — Stage B schema
-- Run against an isolated, disposable modeling database.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle             citext NOT NULL,
  display_name       text   NOT NULL,
  bio                text,
  avatar_small_url   text,
  avatar_large_url   text,
  created_at         timestamptz(3) NOT NULL DEFAULT now(),

  -- Unique normalized handle. citext already makes '=' comparisons
  -- case-insensitive; the regex below additionally pins what's stored
  -- on disk to lowercase, so ORDER BY/display never has to re-normalize.
  CONSTRAINT uq_users_handle UNIQUE (handle),
  CONSTRAINT chk_users_handle_format
    CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  CONSTRAINT chk_users_display_name_len
    CHECK (char_length(display_name) BETWEEN 1 AND 50),
  CONSTRAINT chk_users_bio_len
    CHECK (bio IS NULL OR char_length(bio) <= 160)
);

-- ---------------------------------------------------------------------
-- posts  (originals, replies and reposts — see docs/db/decisions.md)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind           text NOT NULL,
  reply_to_id    uuid REFERENCES posts(id) ON DELETE RESTRICT,
  repost_of_id   uuid REFERENCES posts(id) ON DELETE RESTRICT,
  text           text,
  created_at     timestamptz(3) NOT NULL DEFAULT now(),

  CONSTRAINT chk_posts_kind
    CHECK (kind IN ('original', 'reply', 'repost')),

  -- Single constraint covering: which target column is required per kind,
  -- text presence/length per kind, AND that stored text has no leading/
  -- trailing whitespace (the "trimmed" half of the trim+length rule —
  -- trimming itself happens in the service before insert; this CHECK is
  -- the database's independent guarantee that what lands in the column
  -- is already trimmed).
  CONSTRAINT chk_posts_kind_shape CHECK (
    (kind = 'original'
       AND reply_to_id IS NULL AND repost_of_id IS NULL
       AND text IS NOT NULL AND text = btrim(text)
       AND char_length(text) BETWEEN 1 AND 280)
    OR
    (kind = 'reply'
       AND reply_to_id IS NOT NULL AND repost_of_id IS NULL
       AND text IS NOT NULL AND text = btrim(text)
       AND char_length(text) BETWEEN 1 AND 280)
    OR
    (kind = 'repost'
       AND repost_of_id IS NOT NULL AND reply_to_id IS NULL
       AND text IS NULL)
  )
);

-- No user can repost the same original twice. Partial unique index
-- because the rule only applies to kind = 'repost' rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_posts_one_repost_per_user
  ON posts (author_id, repost_of_id)
  WHERE kind = 'repost';

-- Feed/reply access paths (deliverable 5, added here since the columns
-- exist now):
CREATE INDEX idx_posts_feed_order
  ON posts (created_at DESC, id DESC)
  WHERE kind = 'original';

CREATE INDEX IF NOT EXISTS idx_posts_reply_lookup
  ON posts (reply_to_id, created_at DESC, id DESC)
  WHERE kind = 'reply';

-- NOT enforced here, and deliberately so: "reply_to_id/repost_of_id must
-- point at a row with kind = 'original'" needs to inspect another row's
-- column, which a CHECK constraint cannot do. Enforced in the service
-- layer before insert (SELECT kind FROM posts WHERE id = $target). See
-- constraint-tests.sql for a labeled demonstration of what the FK alone
-- does and does not catch, and docs/db/decisions.md for why this wasn't
-- built as a trigger.

-- ---------------------------------------------------------------------
-- post_media  (one row per post; images is an ordered jsonb array,
-- 1-4 elements — see docs/db/erd.md and docs/db/decisions.md for why
-- this replaced the earlier one-row-per-image design)
-- ---------------------------------------------------------------------
CREATE TABLE post_media (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  images    jsonb NOT NULL,

  -- Array shape only: is it an array, and does it have 1-4 elements.
  -- Array index doubles as position, so there is no separate position
  -- column and therefore no way to have a gap or a duplicate position.
  CONSTRAINT chk_media_images_shape CHECK (
    jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) BETWEEN 1 AND 4
  )
);

-- NOT enforced here, and deliberately so: Postgres CHECK constraints
-- cannot contain subqueries, which rules out looping over
-- jsonb_array_elements(images) inside a CHECK. So per-element field
-- validation (non-empty small_url/large_url/alt_text) is a service-layer
-- guarantee, not a database one — same honesty standard as the
-- "belongs only to an original" rule (also service-layer: a plain FK
-- only proves the referenced post exists, not that its kind is
-- 'original'). See constraint-tests.sql for both documented as gaps.

-- ---------------------------------------------------------------------
-- likes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  timestamptz(3) NOT NULL DEFAULT now(),

  -- Composite PK IS the "like a post once" rule — no separate uniqueness
  -- constraint needed, and no surrogate id (nothing else ever addresses
  -- a single like row on its own).
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post_id ON likes (post_id);

-- ---------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  follower_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz(3) NOT NULL DEFAULT now(),

  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT chk_follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

-- =====================================================================
-- ON DELETE policy summary (user/post deletion endpoints are out of
-- product scope — this is tested only against disposable data):
--
--   posts.author_id      -> RESTRICT   a user with any authored posts
--                                       cannot be deleted; avoids silently
--                                       orphaning/cascading a person's
--                                       whole post history via a users
--                                       endpoint that isn't in scope.
--   posts.reply_to_id    -> RESTRICT   an original with replies cannot
--   posts.repost_of_id   -> RESTRICT   be deleted (nor a repost-of
--                                       target with reposts) — matches
--                                       the PRD's "restrict deleting a
--                                       referenced original."
--   post_media.post_id   -> CASCADE    deleting a post (only possible
--                                       once nothing else RESTRICTs it)
--                                       takes its own media with it —
--                                       media has no life independent
--                                       of its post.
--   likes.user_id/post_id     -> CASCADE   a like has no independent
--   follows.follower_id/following_id -> CASCADE  existence (see prior
--                                       discussion on why comments and
--                                       likes are modeled differently);
--                                       once the user or post is gone,
--                                       the like/follow row is meaningless.
--
-- Net effect: deleting a post is only possible when nothing points at
-- it as an original (no replies, no reposts) — enforced by RESTRICT —
-- and when it IS deletable, its own media/likes go with it automatically
-- via CASCADE. This is a single, explicit, hard-delete policy; no soft
-- delete anywhere in this schema, so nothing mixes the two.
-- =====================================================================
CREATE INDEX idx_posts_author_order
  ON posts (author_id, created_at DESC, id DESC)
  WHERE kind = 'original';