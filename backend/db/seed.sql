-- =====================================================================
-- Social Feed — deterministic seed
-- Source of truth for users/posts/media/likes/follows is the existing
-- app fixture (backend/src/.../fixtures.ts) — same IDs, same text, same
-- timestamps, so this seed and the app's in-memory fixture repository
-- describe the same imagined dataset. One exception, called out below.
--
-- IDEMPOTENCY: every INSERT ends in ON CONFLICT ... DO NOTHING, keyed
-- on each table's primary key. Re-running this file against a database
-- that already has this data is a safe no-op — no duplicate rows, no
-- error. This is NOT an upsert (it won't apply column changes to an
-- existing row with the same ID); for this seed's purpose data never
-- changes for a fixed ID, so insert-or-ignore is the correct idempotent
-- behavior. This script never truncates/drops tables — resetting to a
-- clean slate is a separate, explicit action (see reset.sql below), not
-- something that happens implicitly on every run.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 6 users
-- ---------------------------------------------------------------------
INSERT INTO users (id, handle, display_name, bio, avatar_small_url, avatar_large_url, created_at) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'asha',   'Asha',   'Frontend developer', '/fixtures/asha-48.jpg',   '/fixtures/asha-96.jpg',   '2026-09-01T08:00:00.000Z'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'rahul',  'Rahul',  'Backend developer',  '/fixtures/rahul-48.jpg',  '/fixtures/rahul-96.jpg',  '2026-09-01T08:00:00.000Z'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'meera',  'Meera',  'Designer',           '/fixtures/meera-48.jpg',  '/fixtures/meera-96.jpg',  '2026-09-01T08:00:00.000Z'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'arjun',  'Arjun',  'JavaScript learner', '/fixtures/arjun-48.jpg',  '/fixtures/arjun-96.jpg',  '2026-09-01T08:00:00.000Z'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'neha',   'Neha',   'Product designer',   '/fixtures/neha-48.jpg',   '/fixtures/neha-96.jpg',   '2026-09-01T08:00:00.000Z'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'vikram', 'Vikram', 'Software engineer',  '/fixtures/vikram-48.jpg', '/fixtures/vikram-96.jpg', '2026-09-01T08:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 30 originals (real fixture data, minutes counting down from 10:00)
-- ---------------------------------------------------------------------
INSERT INTO posts (id, author_id, kind, text, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'original', 'My first database-backed post',   '2026-09-01T10:00:00.000Z'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'original', 'Learning NestJS today',            '2026-09-01T09:59:00.000Z'),
  ('33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'original', 'Building a social feed',           '2026-09-01T09:58:00.000Z'),
  ('44444444-4444-4444-8444-444444444444', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'original', 'Understanding dependency injection','2026-09-01T09:57:00.000Z'),
  ('55555555-5555-4555-8555-555555555555', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Working with TypeScript',          '2026-09-01T09:56:00.000Z'),
  ('66666666-6666-4666-8666-666666666666', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'original', 'Exploring Node.js streams',        '2026-09-01T09:55:00.000Z'),
  ('77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'original', 'Today I learned about promises',   '2026-09-01T09:54:00.000Z'),
  ('88888888-8888-4888-8888-888888888888', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'original', 'Understanding async await',        '2026-09-01T09:53:00.000Z'),
  ('99999999-9999-4999-8999-999999999999', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'original', 'Building reusable services',       '2026-09-01T09:52:00.000Z'),
  ('10101010-1010-4101-8101-101010101010', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'original', 'Learning HTTP fundamentals',       '2026-09-01T09:51:00.000Z'),

  -- ---- SYNTHETIC ADDITION (not in the app fixture) ------------------
  -- Rank 10 above ('Learning HTTP fundamentals') is the last item on
  -- page 1 of a 10-per-page feed. This post shares its exact timestamp
  -- and is given a deliberately smaller UUID so ORDER BY created_at
  -- DESC, id DESC places it immediately after — first item on page 2.
  -- This is the PRD's required "page boundary through a tie" case; the
  -- real fixture's own tie (see the last two rows below) sits at the
  -- very end of the list instead, which tests a different scenario
  -- (last-page tie) — both are kept, for different reasons.
  ('10101010-1010-4101-8101-101010101000', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Tie test: same minute as the post above, boundary case', '2026-09-01T09:51:00.000Z'),

  ('12121212-1212-4121-8121-121212121212', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Understanding REST APIs',          '2026-09-01T09:50:00.000Z'),
  ('13131313-1313-4131-8131-131313131313', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'original', 'Practicing API validation',        '2026-09-01T09:49:00.000Z'),
  ('14141414-1414-4141-8141-141414141414', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'original', 'Learning repository patterns',     '2026-09-01T09:48:00.000Z'),
  ('15151515-1515-4151-8151-151515151515', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'original', 'Designing clean modules',          '2026-09-01T09:47:00.000Z'),
  ('16161616-1616-4161-8161-161616161616', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'original', 'Testing backend services',         '2026-09-01T09:46:00.000Z'),
  ('17171717-1717-4171-8171-171717171717', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'original', 'Writing better TypeScript',        '2026-09-01T09:45:00.000Z'),
  ('18181818-1818-4181-8181-181818181818', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Learning error handling',          '2026-09-01T09:44:00.000Z'),
  ('19191919-1919-4191-8191-191919191919', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'original', 'Understanding middleware',         '2026-09-01T09:43:00.000Z'),
  ('20202020-2020-4202-8202-202020202020', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'original', 'Building reliable APIs',           '2026-09-01T09:42:00.000Z'),
  ('21212121-2121-4212-8212-212121212121', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'original', 'Exploring backend architecture',   '2026-09-01T09:41:00.000Z'),
  ('23232323-2323-4232-8232-232323232323', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'original', 'Learning API design',              '2026-09-01T09:40:00.000Z'),
  ('24242424-2424-4242-8242-242424242424', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'original', 'Improving code organization',      '2026-09-01T09:39:00.000Z'),
  ('25252525-2525-4252-8252-252525252525', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Learning testing strategies',      '2026-09-01T09:38:00.000Z'),
  ('26262626-2626-4262-8262-262626262626', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'original', 'Understanding request lifecycle',  '2026-09-01T09:37:00.000Z'),
  ('27272727-2727-4272-8272-272727272727', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'original', 'Working with controllers',         '2026-09-01T09:36:00.000Z'),
  ('28282828-2828-4282-8282-282828282828', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'original', 'Working with services',            '2026-09-01T09:35:00.000Z'),
  ('29292929-2929-4292-8292-292929292929', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'original', 'Understanding DTOs',               '2026-09-01T09:34:00.000Z'),
  ('30303030-3030-4303-8303-303030303030', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'original', 'Learning cursor pagination',       '2026-09-01T09:33:00.000Z'),

  -- Real fixture's own tie — both share 09:32:00, both fall inside the
  -- last page of the feed (position 9 and 10 on page 3), so this tests
  -- "both appear exactly once at the end of the result set," a distinct
  -- case from the boundary-split tie added above.
  ('31313131-3131-4313-8313-313131313131', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'original', 'Preparing for production',         '2026-09-01T09:32:00.000Z'),
  ('32323232-3232-4323-8323-323232323232', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'original', 'Final post in the fixture set',    '2026-09-01T09:32:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 12 replies (real fixture data)
-- ---------------------------------------------------------------------
INSERT INTO posts (id, author_id, kind, reply_to_id, text, created_at) VALUES
  ('33333333-aaaa-4333-8333-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'reply', '11111111-1111-4111-8111-111111111111', 'Great explanation!',       '2026-09-01T09:30:00.000Z'),
  ('44444444-aaaa-4444-8444-444444444444', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'reply', '11111111-1111-4111-8111-111111111111', 'I learned something new.', '2026-09-01T09:29:00.000Z'),
  ('55555555-aaaa-4555-8555-555555555555', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'reply', '22222222-2222-4222-8222-222222222222', 'This is helpful.',         '2026-09-01T09:28:00.000Z'),
  ('66666666-aaaa-4666-8666-666666666666', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'reply', '33333333-3333-4333-8333-333333333333', 'Nice work!',               '2026-09-01T09:27:00.000Z'),
  ('77777777-aaaa-4777-8777-777777777777', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'reply', '44444444-4444-4444-8444-444444444444', 'Thanks for sharing.',      '2026-09-01T09:26:00.000Z'),
  ('88888888-aaaa-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'reply', '55555555-5555-4555-8555-555555555555', 'Very useful.',             '2026-09-01T09:25:00.000Z'),
  ('99999999-aaaa-4999-8999-999999999999', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'reply', '66666666-6666-4666-8666-666666666666', 'Interesting approach.',    '2026-09-01T09:24:00.000Z'),
  ('10101010-aaaa-4101-8101-101010101010', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'reply', '77777777-7777-4777-8777-777777777777', 'I will try this.',        '2026-09-01T09:23:00.000Z'),
  ('12121212-aaaa-4121-8121-121212121212', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'reply', '88888888-8888-4888-8888-888888888888', 'Makes sense.',             '2026-09-01T09:22:00.000Z'),
  ('13131313-aaaa-4131-8131-131313131313', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'reply', '99999999-9999-4999-8999-999999999999', 'Good point.',              '2026-09-01T09:21:00.000Z'),
  ('14141414-aaaa-4141-8141-141414141414', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'reply', '10101010-1010-4101-8101-101010101010', 'Great post.',              '2026-09-01T09:20:00.000Z'),
  ('15151515-aaaa-4151-8151-151515151515', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'reply', '12121212-1212-4121-8121-121212121212', 'Clear and simple.',        '2026-09-01T09:19:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4 reposts (real fixture data)
-- ---------------------------------------------------------------------
INSERT INTO posts (id, author_id, kind, repost_of_id, created_at) VALUES
  ('16161616-aaaa-4161-8161-161616161616', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'repost', '13131313-1313-4131-8131-131313131313', '2026-09-01T09:18:00.000Z'),
  ('17171717-aaaa-4171-8171-171717171717', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'repost', '14141414-1414-4141-8141-141414141414', '2026-09-01T09:17:00.000Z'),
  ('18181818-aaaa-4181-8181-181818181818', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'repost', '15151515-1515-4151-8151-151515151515', '2026-09-01T09:16:00.000Z'),
  ('19191919-aaaa-4191-8191-191919191919', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'repost', '20202020-2020-4202-8202-202020202020', '2026-09-01T09:15:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- post_media — one row per post, images as an ordered jsonb array.
-- 10 media rows total across the images arrays below (real fixture
-- data); note post 77777777 has 2 images in one array (positions 0
-- and 1 collapsed into array order), and vikram (ffffffff...) has zero
-- media anywhere — both deliberate edge cases already present in the
-- app fixture.
-- ---------------------------------------------------------------------
INSERT INTO post_media (post_id, images) VALUES
  ('11111111-1111-4111-8111-111111111111',
   '[{"small_url":"/fixtures/desk-480.jpg","large_url":"/fixtures/desk-1200.jpg","alt_text":"A desk with a laptop"}]'::jsonb),
  ('22222222-2222-4222-8222-222222222222',
   '[{"small_url":"/fixtures/code-480.jpg","large_url":"/fixtures/code-1200.jpg","alt_text":"Laptop showing code"}]'::jsonb),
  ('33333333-3333-4333-8333-333333333333',
   '[{"small_url":"/fixtures/feed-480.jpg","large_url":"/fixtures/feed-1200.jpg","alt_text":"Social feed interface"}]'::jsonb),
  ('44444444-4444-4444-8444-444444444444',
   '[{"small_url":"/fixtures/architecture-480.jpg","large_url":"/fixtures/architecture-1200.jpg","alt_text":"Application architecture"}]'::jsonb),
  ('55555555-5555-4555-8555-555555555555',
   '[{"small_url":"/fixtures/typescript-480.jpg","large_url":"/fixtures/typescript-1200.jpg","alt_text":"TypeScript editor"}]'::jsonb),
  ('77777777-7777-4777-8777-777777777777',
   '[{"small_url":"/fixtures/javascript-480.jpg","large_url":"/fixtures/javascript-1200.jpg","alt_text":"JavaScript code"},'
   '{"small_url":"/fixtures/node-480.jpg","large_url":"/fixtures/node-1200.jpg","alt_text":"Node.js development"}]'::jsonb),
  ('88888888-8888-4888-8888-888888888888',
   '[{"small_url":"/fixtures/async-480.jpg","large_url":"/fixtures/async-1200.jpg","alt_text":"Async code example"}]'::jsonb),
  ('99999999-9999-4999-8999-999999999999',
   '[{"small_url":"/fixtures/service-480.jpg","large_url":"/fixtures/service-1200.jpg","alt_text":"Backend service diagram"}]'::jsonb),
  ('10101010-1010-4101-8101-101010101010',
   '[{"small_url":"/fixtures/http-480.jpg","large_url":"/fixtures/http-1200.jpg","alt_text":"HTTP request example"}]'::jsonb)
ON CONFLICT (post_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 15 likes (real fixture data)
-- ---------------------------------------------------------------------
INSERT INTO likes (user_id, post_id) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '33333333-3333-4333-8333-333333333333'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '44444444-4444-4444-8444-444444444444'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', '55555555-5555-4555-8555-555555555555'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '77777777-7777-4777-8777-777777777777'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '88888888-8888-4888-8888-888888888888'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '99999999-9999-4999-8999-999999999999'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '10101010-1010-4101-8101-101010101010'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', '12121212-1212-4121-8121-121212121212'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '13131313-1313-4131-8131-131313131313'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '14141414-1414-4141-8141-141414141414'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '15151515-1515-4151-8151-151515151515')
ON CONFLICT (user_id, post_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 8 follow edges (real fixture data)
-- ---------------------------------------------------------------------
INSERT INTO follows (follower_id, following_id) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')
ON CONFLICT (follower_id, following_id) DO NOTHING;

COMMIT;
