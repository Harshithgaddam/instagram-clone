-- Constraint checks for the schema in schema.sql.
-- Run with psql after schema.sql has been applied:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraint-tests.sql
--
-- All rows are created inside one transaction and rolled back at the end.
-- This file is intentionally psql-specific because it uses \echo and \set.

\set ON_ERROR_STOP on
\echo 'Starting constraint tests'

BEGIN;

-- Fixed IDs keep the assertions readable and make this run disposable.
SELECT
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid AS user_a,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid AS user_b,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid AS original_id,
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid AS reply_id,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid AS repost_id,
  'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid AS media_id
\gset ids_

-- Helper: execute a statement that must fail with the expected SQLSTATE.
CREATE OR REPLACE FUNCTION pg_temp.expect_sqlstate(
  expected_state text,
  statement text
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE statement;
  RAISE EXCEPTION 'Expected SQLSTATE %, but statement succeeded: %',
    expected_state, statement;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLSTATE <> expected_state THEN
      RAISE EXCEPTION 'Expected SQLSTATE %, got % for: %',
        expected_state, SQLSTATE, statement;
    END IF;
END;
$$;

-- Seed two users. citext plus the lowercase format check enforce the handle rule.
INSERT INTO users (id, handle, display_name)
VALUES
  (:'ids_user_a', 'alice', 'Alice'),
  (:'ids_user_b', 'bob', 'Bob');

-- Duplicate handles are rejected by uq_users_handle.
SELECT pg_temp.expect_sqlstate(
  '23505',
  format($sql$
    INSERT INTO users (id, handle, display_name)
    VALUES ('99999999-9999-4999-8999-999999999999', 'alice', 'Duplicate')
  $sql$)
);

-- Uppercase handles do not satisfy the stored-lowercase policy.
SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO users (id, handle, display_name)
    VALUES ('99999999-9999-4999-8999-999999999998', 'Alice', 'Uppercase')
  $sql$)
);

-- Create an original post.
INSERT INTO posts (id, author_id, kind, text)
VALUES (:'ids_original_id', :'ids_user_a', 'original', 'Original text');

-- Author FK rejects an orphan post.
SELECT pg_temp.expect_sqlstate(
  '23503',
  format($sql$
    INSERT INTO posts (author_id, kind, text)
    VALUES ('99999999-9999-4999-8999-999999999997', 'original', 'Orphan')
  $sql$)
);

-- Stored text must be trimmed and 1-280 characters.
SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO posts (author_id, kind, text)
    VALUES ('%s', 'original', ' leading space')
  $sql$, :'ids_user_a')
);

SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO posts (author_id, kind, text)
    VALUES ('%s', 'original', repeat('x', 281))
  $sql$, :'ids_user_a')
);

-- A reply has text and a reply target, but no repost target.
INSERT INTO posts (id, author_id, kind, reply_to_id, text)
VALUES (
  :'ids_reply_id',
  :'ids_user_b',
  'reply',
  :'ids_original_id',
  'A reply'
);

-- A repost has a target and no new text.
INSERT INTO posts (id, author_id, kind, repost_of_id, text)
VALUES (
  :'ids_repost_id',
  :'ids_user_b',
  'repost',
  :'ids_original_id',
  NULL
);

-- Invalid kind/reference/text combinations are rejected.
SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO posts (author_id, kind, text)
    VALUES ('%s', 'repost', 'Copied original text')
  $sql$, :'ids_user_a')
);

SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO posts (author_id, kind, text)
    VALUES ('%s', 'original', NULL)
  $sql$, :'ids_user_a')
);

-- A foreign key checks target existence, but not target kind. The service must
-- reject a reply/repost whose target is another reply or repost.
INSERT INTO posts (author_id, kind, reply_to_id, text)
VALUES (:'ids_user_a', 'reply', :'ids_reply_id', 'Database allows target-kind gap');

-- One like per user/post: the composite PK rejects a duplicate.
INSERT INTO likes (user_id, post_id)
VALUES (:'ids_user_b', :'ids_original_id');

SELECT pg_temp.expect_sqlstate(
  '23505',
  format($sql$
    INSERT INTO likes (user_id, post_id)
    VALUES ('%s', '%s')
  $sql$, :'ids_user_b', :'ids_original_id')
);

-- Follow pairs are unique and self-follows are rejected.
INSERT INTO follows (follower_id, following_id)
VALUES (:'ids_user_b', :'ids_user_a');

SELECT pg_temp.expect_sqlstate(
  '23505',
  format($sql$
    INSERT INTO follows (follower_id, following_id)
    VALUES ('%s', '%s')
  $sql$, :'ids_user_b', :'ids_user_a')
);

SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO follows (follower_id, following_id)
    VALUES ('%s', '%s')
  $sql$, :'ids_user_a', :'ids_user_a')
);

-- The partial unique index prevents one user from reposting one original twice.
INSERT INTO posts (author_id, kind, repost_of_id)
VALUES (:'ids_user_b', 'repost', :'ids_original_id');

SELECT pg_temp.expect_sqlstate(
  '23505',
  format($sql$
    INSERT INTO posts (author_id, kind, repost_of_id)
    VALUES ('%s', 'repost', '%s')
  $sql$, :'ids_user_b', :'ids_original_id')
);

-- Media must reference a post and contain 1-4 images.
INSERT INTO post_media (id, post_id, images)
VALUES (
  :'ids_media_id',
  :'ids_original_id',
  '[{"small_url":"/small.jpg","large_url":"/large.jpg","alt_text":"A desk"}]'::jsonb
);

-- Use a second valid post to test the array cardinality independently from
-- the one-media-row-per-post UNIQUE constraint.
INSERT INTO posts (id, author_id, kind, text)
VALUES (
  '99999999-9999-4999-8999-999999999995',
  :'ids_user_a',
  'original',
  'Second original'
);

SELECT pg_temp.expect_sqlstate(
  '23514',
  format($sql$
    INSERT INTO post_media (post_id, images)
    VALUES ('%s', '[]'::jsonb)
  $sql$, '99999999-9999-4999-8999-999999999995')
);

SELECT pg_temp.expect_sqlstate(
  '23503',
  format($sql$
    INSERT INTO post_media (post_id, images)
    VALUES ('%s', '[]'::jsonb)
  $sql$, '99999999-9999-4999-8999-999999999996')
);

-- Duplicate media is rejected by post_media.post_id UNIQUE.
SELECT pg_temp.expect_sqlstate(
  '23505',
  format($sql$
    INSERT INTO post_media (post_id, images)
    VALUES ('%s', '[{"small_url":"/x","large_url":"/y","alt_text":"x"}]'::jsonb)
  $sql$, :'ids_original_id')
);

-- ON DELETE policies: user deletion is restricted by posts.author_id, while
-- deleting a post removes its media and likes only when no RESTRICT reference
-- (reply/repost) prevents the deletion. These policies are documented in
-- schema.sql and should be tested against disposable rows when deletion
-- endpoints are introduced.

ROLLBACK;
\echo 'Constraint tests passed; all test data rolled back'
