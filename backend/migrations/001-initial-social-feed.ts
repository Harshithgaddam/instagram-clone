import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class InitialSocialFeed1789667822000
  implements MigrationInterface
{
  name = 'InitialSocialFeed1789667822000';

  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // PostgreSQL extension required by users.handle
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS citext
    `);

    // --------------------------------------------------
    // users
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY
          DEFAULT gen_random_uuid(),

        handle citext NOT NULL,

        display_name text NOT NULL,

        bio text,

        avatar_small_url text,

        avatar_large_url text,

        created_at timestamptz(3) NOT NULL
          DEFAULT now(),

        CONSTRAINT uq_users_handle
          UNIQUE (handle),

        CONSTRAINT chk_users_handle_format
          CHECK (
            handle ~ '^[a-z0-9_]{3,20}$'
          ),

        CONSTRAINT chk_users_display_name_len
          CHECK (
            char_length(display_name)
            BETWEEN 1 AND 50
          ),

        CONSTRAINT chk_users_bio_len
          CHECK (
            bio IS NULL
            OR char_length(bio) <= 160
          )
      )
    `);

    // --------------------------------------------------
    // posts
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE posts (
        id uuid PRIMARY KEY
          DEFAULT gen_random_uuid(),

        author_id uuid NOT NULL
          REFERENCES users(id)
          ON DELETE RESTRICT,

        kind text NOT NULL,

        reply_to_id uuid
          REFERENCES posts(id)
          ON DELETE RESTRICT,

        repost_of_id uuid
          REFERENCES posts(id)
          ON DELETE RESTRICT,

        text text,

        created_at timestamptz(3) NOT NULL
          DEFAULT now(),

        CONSTRAINT chk_posts_kind
          CHECK (
            kind IN (
              'original',
              'reply',
              'repost'
            )
          ),

        CONSTRAINT chk_posts_kind_shape
          CHECK (
            (
              kind = 'original'
              AND reply_to_id IS NULL
              AND repost_of_id IS NULL
              AND text IS NOT NULL
              AND text = btrim(text)
              AND char_length(text)
                BETWEEN 1 AND 280
            )

            OR

            (
              kind = 'reply'
              AND reply_to_id IS NOT NULL
              AND repost_of_id IS NULL
              AND text IS NOT NULL
              AND text = btrim(text)
              AND char_length(text)
                BETWEEN 1 AND 280
            )

            OR

            (
              kind = 'repost'
              AND repost_of_id IS NOT NULL
              AND reply_to_id IS NULL
              AND text IS NULL
            )
          )
      )
    `);

    // --------------------------------------------------
    // posts indexes
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE UNIQUE INDEX
        uq_posts_one_repost_per_user
      ON posts (
        author_id,
        repost_of_id
      )
      WHERE kind = 'repost'
    `);

    await queryRunner.query(`
      CREATE INDEX
        idx_posts_feed_order
      ON posts (
        created_at DESC,
        id DESC
      )
      WHERE kind = 'original'
    `);

    await queryRunner.query(`
      CREATE INDEX
        idx_posts_reply_lookup
      ON posts (
        reply_to_id,
        created_at DESC,
        id DESC
      )
      WHERE kind = 'reply'
    `);

    await queryRunner.query(`
      CREATE INDEX
        idx_posts_author_order
      ON posts (
        author_id,
        created_at DESC,
        id DESC
      )
      WHERE kind = 'original'
    `);

    // --------------------------------------------------
    // post_media
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE post_media (
        id uuid PRIMARY KEY
          DEFAULT gen_random_uuid(),

        post_id uuid NOT NULL UNIQUE
          REFERENCES posts(id)
          ON DELETE CASCADE,

        images jsonb NOT NULL,

        CONSTRAINT chk_media_images_shape
          CHECK (
            jsonb_typeof(images) = 'array'
            AND jsonb_array_length(images)
              BETWEEN 1 AND 4
          )
      )
    `);

    // --------------------------------------------------
    // likes
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE likes (
        user_id uuid NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        post_id uuid NOT NULL
          REFERENCES posts(id)
          ON DELETE CASCADE,

        created_at timestamptz(3) NOT NULL
          DEFAULT now(),

        PRIMARY KEY (
          user_id,
          post_id
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX
        idx_likes_post_id
      ON likes (post_id)
    `);

    // --------------------------------------------------
    // follows
    // --------------------------------------------------

    await queryRunner.query(`
      CREATE TABLE follows (
        follower_id uuid NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        following_id uuid NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        created_at timestamptz(3) NOT NULL
          DEFAULT now(),

        PRIMARY KEY (
          follower_id,
          following_id
        ),

        CONSTRAINT chk_follows_no_self_follow
          CHECK (
            follower_id <> following_id
          )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX
        idx_follows_following_id
      ON follows (following_id)
    `);
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Reverse dependency order.

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        idx_follows_following_id
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS follows
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        idx_likes_post_id
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS likes
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS post_media
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        idx_posts_author_order
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        idx_posts_reply_lookup
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        idx_posts_feed_order
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS
        uq_posts_one_repost_per_user
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS posts
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS users
    `);
  }
}