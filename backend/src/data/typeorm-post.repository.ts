import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { DatabaseService } from '../database/database.service';

import {
  Post,
  PostKind,
} from '../database/entities/post.entity';

import { User } from '../database/entities/user.entity';

import { PostMedia } from '../database/entities/post-media.entity';

import { Like } from '../database/entities/like.entity';

import {
  CreatePostCommand,
  CreatedPostResult,
  FeedCursor,
  FeedPageResult,
  FeedPostResult,
  LikeResult,
  MediaImage,
  MediaResult,
  PostDetailResult,
  ProfileMediaPageResult,
  ProfileMediaResult,
  RepositoryError,
} from './repository.types';

import {
  FindPostsOptions,
  Media,
  PostRepository,
} from './post.repository';

@Injectable()
export class TypeOrmPostRepository
  implements PostRepository
{
  private readonly posts: Repository<Post>;
  private readonly users: Repository<User>;
  private readonly media: Repository<PostMedia>;
  private readonly likes: Repository<Like>;

  constructor(
    private readonly database: DatabaseService,
  ) {
    this.posts =
      this.database.getRepository(Post);

    this.users =
      this.database.getRepository(User);

    this.media =
      this.database.getRepository(PostMedia);

    this.likes =
      this.database.getRepository(Like);
  }

  // =========================================================
  // EXISTING METHOD 1: FIND ALL
  // PostgreSQL implementation
  // =========================================================

  async findAll(
    options?: FindPostsOptions,
  ): Promise<Post[]> {
    try {
      const qb =
        this.posts.createQueryBuilder('post');

      if (options?.kind) {
        qb.andWhere(
          'post.kind = :kind',
          {
            kind: options.kind,
          },
        );
      }

      if (options?.authorId) {
        qb.andWhere(
          'post.author_id = :authorId',
          {
            authorId: options.authorId,
          },
        );
      }

      if (
        options?.cursorCreatedAt &&
        options?.cursorId
      ) {
        qb.andWhere(
          `(
            post.created_at < :cursorCreatedAt
            OR (
              post.created_at = :cursorCreatedAt
              AND post.id < :cursorId
            )
          )`,
          {
            cursorCreatedAt:
              options.cursorCreatedAt,
            cursorId:
              options.cursorId,
          },
        );
      }

      qb.orderBy(
        'post.created_at',
        'DESC',
      );

      qb.addOrderBy(
        'post.id',
        'DESC',
      );

      if (
        options?.offset !== undefined
      ) {
        qb.skip(options.offset);
      }

      if (
        options?.limit !== undefined
      ) {
        qb.take(options.limit);
      }

      return await qb.getMany();
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD 2: FIND BY ID
  // PostgreSQL implementation
  // =========================================================

  async findById(
    id: string,
  ): Promise<Post | null> {
    try {
      return await this.posts.findOne({
        where: {
          id,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD 3: FIND MEDIA BY POST ID
  // PostgreSQL implementation
  // =========================================================

  async findMediaByPostId(
    postId: string,
  ): Promise<Media[]> {
    try {
      const rows =
        await this.media.find({
          where: {
            postId,
          },
        });

      /*
       * post_media in the new database stores the
       * image information inside the JSONB `images`
       * column.
       *
       * We expose the database representation through
       * the repository boundary.
       */
      return rows.map((row) => ({
        id: row.id,
        postId: row.postId,
        images: row.images as MediaImage[],
      }));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD 4: COUNT LIKES
  // PostgreSQL implementation
  // =========================================================

  async countLikes(
    postId: string,
  ): Promise<number> {
    try {
      return await this.likes.count({
        where: {
          postId,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD 5: COUNT REPLIES
  // PostgreSQL implementation
  // =========================================================

  async countReplies(
    postId: string,
  ): Promise<number> {
    try {
      return await this.posts.count({
        where: {
          replyToId: postId,
          kind: PostKind.REPLY,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD 6: IS LIKED BY USER
  // PostgreSQL implementation
  // =========================================================

  async isLikedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const like =
        await this.likes.findOne({
          where: {
            postId,
            userId,
          },
        });

      return like !== null;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2.1 HOME FEED
  // =========================================================

  async listOriginalFeed(
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult> {
    try {
      const qb =
        this.posts
          .createQueryBuilder('post')
          .where(
            'post.kind = :kind',
            {
              kind: PostKind.ORIGINAL,
            },
          )
          .orderBy(
            'post.created_at',
            'DESC',
          )
          .addOrderBy(
            'post.id',
            'DESC',
          )
          .take(limit + 1);

      this.applyCursor(
        qb,
        cursor,
      );

      const posts =
        await qb.getMany();

      return this.buildFeedPage(
        posts,
        limit,
        viewerId,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2.2 POST DETAIL
  // =========================================================

  async getPostDetail(
    postId: string,
    viewerId: string,
  ): Promise<PostDetailResult | null> {
    try {
      const post =
        await this.posts.findOne({
          where: {
            id: postId,
          },
        });

      if (!post) {
        return null;
      }

      const resultPage =
        await this.buildFeedPage(
          [post],
          1,
          viewerId,
        );

      const result =
        resultPage.items[0];

      if (!result) {
        return null;
      }

      let referencedPost:
        FeedPostResult | null = null;

      const referenceId =
        post.kind === PostKind.REPLY
          ? post.replyToId
          : post.kind === PostKind.REPOST
            ? post.repostOfId
            : null;

      if (referenceId) {
        const referenced =
          await this.posts.findOne({
            where: {
              id: referenceId,
            },
          });

        if (referenced) {
          const referencedPage =
            await this.buildFeedPage(
              [referenced],
              1,
              viewerId,
            );

          referencedPost =
            referencedPage.items[0] ??
            null;
        }
      }

      return {
        ...result,
        referencedPost,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2.3 DIRECT REPLIES
  // =========================================================

  async listDirectReplies(
    postId: string,
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult> {
    try {
      const qb =
        this.posts
          .createQueryBuilder('post')
          .where(
            'post.reply_to_id = :postId',
            {
              postId,
            },
          )
          .andWhere(
            'post.kind = :kind',
            {
              kind: PostKind.REPLY,
            },
          )
          .orderBy(
            'post.created_at',
            'DESC',
          )
          .addOrderBy(
            'post.id',
            'DESC',
          )
          .take(limit + 1);

      this.applyCursor(
        qb,
        cursor,
      );

      const posts =
        await qb.getMany();

      return this.buildFeedPage(
        posts,
        limit,
        viewerId,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2.4 PROFILE MEDIA
  // =========================================================

  async listProfileMedia(
    userId: string,
    cursor: FeedCursor | null,
    limit: number,
  ): Promise<ProfileMediaPageResult> {
    try {
      const qb =
        this.media
          .createQueryBuilder('media')
          .innerJoin(
            Post,
            'post',
            'post.id = media.post_id',
          )
          .where(
            'post.author_id = :userId',
            {
              userId,
            },
          )
          .andWhere(
            'post.kind = :kind',
            {
              kind: PostKind.ORIGINAL,
            },
          )
          .select([
            'media.id AS media_id',
            'media.post_id AS media_post_id',
            'media.images AS media_images',
            'post.created_at AS post_created_at',
            'post.id AS post_id',
          ])
          .orderBy(
            'post.created_at',
            'DESC',
          )
          .addOrderBy(
            'post.id',
            'DESC',
          )
          .take(limit + 1);

      if (cursor) {
        qb.andWhere(
          `(
            post.created_at < :cursorCreatedAt
            OR (
              post.created_at = :cursorCreatedAt
              AND post.id < :cursorId
            )
          )`,
          {
            cursorCreatedAt:
              cursor.createdAt,
            cursorId:
              cursor.id,
          },
        );
      }

      const rows =
        await qb.getRawMany();

      const hasMore =
        rows.length > limit;

      const pageRows =
        rows.slice(0, limit);

      const items:
        ProfileMediaResult[] =
        pageRows.map(
          (row) => ({
            id: row.media_id,
            postId:
              row.media_post_id,
            createdAt:
              new Date(
                row.post_created_at,
              ),
            images:
              row.media_images as MediaImage[],
          }),
        );

      const last =
        items[items.length - 1];

      return {
        items,
        hasMore,
        nextCursor:
          hasMore && last
            ? {
                createdAt:
                  last.createdAt,
                id: last.postId,
              }
            : null,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2.5 SEARCH
  // =========================================================

  async searchOriginals(
    query: string,
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult> {
    const normalized =
      query.trim();

    const codePointLength =
      [...normalized].length;

    if (
      codePointLength < 2 ||
      codePointLength > 80
    ) {
      throw new RepositoryError(
        'INTERNAL',
        'Search query must contain 2 to 80 characters',
      );
    }

    try {
      const pattern =
        `%${this.escapeLikePattern(
          normalized,
        )}%`;

      const qb =
        this.posts
          .createQueryBuilder('post')
          .where(
            'post.kind = :kind',
            {
              kind: PostKind.ORIGINAL,
            },
          )
          .andWhere(
            `post.text ILIKE :pattern ESCAPE '\\'`,
            {
              pattern,
            },
          )
          .orderBy(
            'post.created_at',
            'DESC',
          )
          .addOrderBy(
            'post.id',
            'DESC',
          )
          .take(limit + 1);

      this.applyCursor(
        qb,
        cursor,
      );

      const posts =
        await qb.getMany();

      return this.buildFeedPage(
        posts,
        limit,
        viewerId,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
// C3 CREATE POST
// =========================================================

async createPost(
  command: CreatePostCommand,
): Promise<CreatedPostResult> {
  try {
    /*
     * The complete write is executed through TypeORM's
     * transaction callback.
     *
     * IMPORTANT:
     * Use repositories obtained from `manager`.
     * Do not use this.posts / this.likes inside this callback.
     */

    const saved =
      await this.database.transaction(
        async (manager) => {
          const postRepository =
            manager.getRepository(Post);

          const post =
            postRepository.create({
              /*
               * ID deliberately omitted.
               * PostgreSQL generates it.
               */

              authorId:
                command.authorId,

              kind:
                command.kind as PostKind,

              text:
                command.text ?? null,

              replyToId:
                command.replyToId ?? null,

              repostOfId:
                command.repostOfId ?? null,

              /*
               * createdAt deliberately omitted.
               * PostgreSQL/entity default generates it.
               */
            });

          return postRepository.save(
            post,
          );
        },
      );

    return {
      id: saved.id,

      authorId:
        saved.authorId,

      kind:
        saved.kind as
          | 'original'
          | 'reply'
          | 'repost',

      text:
        saved.text,

      replyToId:
        saved.replyToId,

      repostOfId:
        saved.repostOfId,

      createdAt:
        saved.createdAt,
    };
  } catch (error) {
    this.handleDatabaseError(
      error,
    );
  }
}

  // =========================================================
  // C2.7 LIKE / UNLIKE
  // =========================================================

 // =========================================================
// C3 LIKE / UNLIKE
// =========================================================

async setLike(
  postId: string,
  viewerId: string,
  desiredState: boolean,
): Promise<LikeResult> {
  try {
    return await this.database.transaction(
      async (manager) => {
        const postRepository =
          manager.getRepository(Post);

        const likeRepository =
          manager.getRepository(Like);

        /*
         * Verify the post exists inside the transaction.
         */

        const post =
          await postRepository.findOne({
            where: {
              id: postId,
            },
          });

        if (!post) {
          throw new RepositoryError(
            'NOT_FOUND',
            'Post not found',
          );
        }

        /*
         * Likes are allowed on:
         *   original
         *   reply
         *
         * Repost rows cannot themselves be liked.
         */

        if (
          post.kind !==
            PostKind.ORIGINAL &&
          post.kind !==
            PostKind.REPLY
        ) {
          throw new RepositoryError(
            'INVALID_TARGET',
            'Repost rows cannot be liked',
          );
        }

        // ------------------------------------------------------
        // LIKE
        // ------------------------------------------------------

        if (desiredState) {
          /*
           * PostgreSQL:
           *
           * INSERT ... ON CONFLICT DO NOTHING
           *
           * Therefore:
           *
           * first request  -> inserts
           * repeated like  -> no-op
           * concurrent like -> one row
           *
           * The composite PK in schema.sql is the real
           * uniqueness protection.
           */

          await likeRepository
            .createQueryBuilder()
            .insert()
            .into(Like)
            .values({
              userId:
                viewerId,

              postId:
                postId,
            })
            .orIgnore()
            .execute();
        }

        // ------------------------------------------------------
        // UNLIKE
        // ------------------------------------------------------

        else {
          await likeRepository.delete({
            userId:
              viewerId,

            postId:
              postId,
          });
        }

        /*
         * Count comes from the likes relation.
         *
         * We do NOT maintain a stored like_count column.
         */

        const likeCount =
          await likeRepository.count({
            where: {
              postId:
                postId,
            },
          });

        return {
          postId,

          likedByViewer:
            desiredState,

          likeCount,
        };
      },
    );
  } catch (error) {
    this.handleDatabaseError(
      error,
    );
  }
}

  // =========================================================
  // PRIVATE: BUILD FEED PAGE
  // =========================================================

  private async buildFeedPage(
    posts: Post[],
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult> {
    const hasMore =
      posts.length > limit;

    const pagePosts =
      posts.slice(0, limit);

    if (pagePosts.length === 0) {
      return {
        items: [],
        hasMore: false,
        nextCursor: null,
      };
    }

    const postIds =
      pagePosts.map(
        (post) => post.id,
      );

    const authorIds = [
      ...new Set(
        pagePosts.map(
          (post) =>
            post.authorId,
        ),
      ),
    ];

    const referenceIds = [
      ...new Set(
        pagePosts
          .flatMap(
            (post) => [
              post.replyToId,
              post.repostOfId,
            ],
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    ];

    const [
      authors,
      media,
      counts,
      likedIds,
    ] = await Promise.all([
      this.getAuthors(
        authorIds,
      ),

      this.getMedia(
        postIds,
      ),

      this.getCounts(
        postIds,
      ),

      this.getViewerLikedIds(
        postIds,
        viewerId,
      ),
    ]);

    const authorMap =
      new Map(
        authors.map(
          (author) => [
            author.id,
            author,
          ],
        ),
      );

    const mediaMap =
      new Map(
        media.map(
          (item) => [
            item.postId,
            item,
          ],
        ),
      );

    const countMap =
      new Map(
        counts.map(
          (item) => [
            item.postId,
            item,
          ],
        ),
      );

    const referencedPosts =
      referenceIds.length > 0
        ? await this.posts.find({
            where:
              referenceIds.map(
                (id) => ({
                  id,
                }),
              ),
          })
        : [];

    const referencedMap =
      new Map(
        referencedPosts.map(
          (post) => [
            post.id,
            post,
          ],
        ),
      );

    const items =
      pagePosts.map(
        (post) => {
          const author =
            authorMap.get(
              post.authorId,
            );

          if (!author) {
            throw new RepositoryError(
              'INTERNAL',
              `Author ${post.authorId} not found`,
            );
          }

          const count =
            countMap.get(
              post.id,
            ) ?? {
              postId: post.id,
              likeCount: 0,
              replyCount: 0,
              repostCount: 0,
            };

          return {
            id: post.id,
            authorId:
              post.authorId,
            kind:
              post.kind as any,
            text:
              post.text,
            replyToId:
              post.replyToId,
            repostOfId:
              post.repostOfId,
            createdAt:
              post.createdAt,

            author,

            media:
              mediaMap.get(
                post.id,
              ) ?? null,

            likeCount:
              count.likeCount,

            replyCount:
              count.replyCount,

            repostCount:
              count.repostCount,

            likedByViewer:
              likedIds.has(
                post.id,
              ),
          };
        },
      );

    const last =
      items[items.length - 1];

    return {
      items,
      hasMore,

      nextCursor:
        hasMore && last
          ? {
              createdAt:
                last.createdAt,
              id:
                last.id,
            }
          : null,
    };
  }

  // =========================================================
  // PRIVATE: AUTHORS
  // =========================================================

  private async getAuthors(
    authorIds: string[],
  ): Promise<User[]> {
    if (authorIds.length === 0) {
      return [];
    }

    return this.users
      .createQueryBuilder('user')
      .where(
        'user.id IN (:...authorIds)',
        {
          authorIds,
        },
      )
      .getMany();
  }

  // =========================================================
  // PRIVATE: MEDIA
  // =========================================================

  private async getMedia(
    postIds: string[],
  ): Promise<MediaResult[]> {
    if (postIds.length === 0) {
      return [];
    }

    const rows =
      await this.media
        .createQueryBuilder('media')
        .where(
          'media.post_id IN (:...postIds)',
          {
            postIds,
          },
        )
        .getMany();

    return rows.map(
      (row) => ({
        id: row.id,
        postId:
          row.postId,
        images:
          row.images as MediaImage[],
      }),
    );
  }

  // =========================================================
  // PRIVATE: COUNTS
  // =========================================================

  private async getCounts(
    postIds: string[],
  ): Promise<
    Array<{
      postId: string;
      likeCount: number;
      replyCount: number;
      repostCount: number;
    }>
  > {
    if (postIds.length === 0) {
      return [];
    }

    const [
      likes,
      replies,
      reposts,
    ] = await Promise.all([
      this.likes
        .createQueryBuilder('like')
        .select(
          'like.post_id',
          'postId',
        )
        .addSelect(
          'COUNT(*)',
          'count',
        )
        .where(
          'like.post_id IN (:...postIds)',
          {
            postIds,
          },
        )
        .groupBy(
          'like.post_id',
        )
        .getRawMany(),

      this.posts
        .createQueryBuilder('post')
        .select(
          'post.reply_to_id',
          'postId',
        )
        .addSelect(
          'COUNT(*)',
          'count',
        )
        .where(
          'post.reply_to_id IN (:...postIds)',
          {
            postIds,
          },
        )
        .andWhere(
          'post.kind = :kind',
          {
            kind: PostKind.REPLY,
          },
        )
        .groupBy(
          'post.reply_to_id',
        )
        .getRawMany(),

      this.posts
        .createQueryBuilder('post')
        .select(
          'post.repost_of_id',
          'postId',
        )
        .addSelect(
          'COUNT(*)',
          'count',
        )
        .where(
          'post.repost_of_id IN (:...postIds)',
          {
            postIds,
          },
        )
        .andWhere(
          'post.kind = :kind',
          {
            kind: PostKind.REPOST,
          },
        )
        .groupBy(
          'post.repost_of_id',
        )
        .getRawMany(),
    ]);

    const map =
      new Map<
        string,
        {
          postId: string;
          likeCount: number;
          replyCount: number;
          repostCount: number;
        }
      >();

    for (const postId of postIds) {
      map.set(
        postId,
        {
          postId,
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
        },
      );
    }

    for (const row of likes) {
      const item =
        map.get(row.postId);

      if (item) {
        item.likeCount =
          Number(row.count);
      }
    }

    for (const row of replies) {
      const item =
        map.get(row.postId);

      if (item) {
        item.replyCount =
          Number(row.count);
      }
    }

    for (const row of reposts) {
      const item =
        map.get(row.postId);

      if (item) {
        item.repostCount =
          Number(row.count);
      }
    }

    return [...map.values()];
  }

  // =========================================================
  // PRIVATE: VIEWER LIKE STATE
  // =========================================================

  private async getViewerLikedIds(
    postIds: string[],
    viewerId: string,
  ): Promise<Set<string>> {
    if (postIds.length === 0) {
      return new Set();
    }

    const rows =
      await this.likes
        .createQueryBuilder('like')
        .select(
          'like.post_id',
          'postId',
        )
        .where(
          'like.user_id = :viewerId',
          {
            viewerId,
          },
        )
        .andWhere(
          'like.post_id IN (:...postIds)',
          {
            postIds,
          },
        )
        .getRawMany();

    return new Set(
      rows.map(
        (row) => row.postId,
      ),
    );
  }

  // =========================================================
  // PRIVATE: CURSOR
  // =========================================================

  private applyCursor(
    qb: SelectQueryBuilder<Post>,
    cursor: FeedCursor | null,
  ): void {
    if (!cursor) {
      return;
    }

    qb.andWhere(
      `(
        post.created_at < :cursorCreatedAt
        OR (
          post.created_at = :cursorCreatedAt
          AND post.id < :cursorId
        )
      )`,
      {
        cursorCreatedAt:
          cursor.createdAt,
        cursorId:
          cursor.id,
      },
    );
  }

  // =========================================================
  // PRIVATE: ESCAPE SEARCH
  // =========================================================

  private escapeLikePattern(
    value: string,
  ): string {
    return value.replace(
      /[\\%_]/g,
      '\\$&',
    );
  }

  // =========================================================
  // PRIVATE: DATABASE ERROR HANDLING
  // =========================================================

  private handleDatabaseError(
  error: unknown,
): never {
  /*
   * Never convert our intentional domain errors
   * into INTERNAL.
   */

  if (
    error instanceof RepositoryError
  ) {
    throw error;
  }

  /*
   * PostgreSQL driver errors expose SQLSTATE
   * through `code`.
   */

  const databaseError =
    error as {
      code?: string;
    };

  switch (
    databaseError.code
  ) {
    /*
     * Unique violation.
     *
     * Most importantly:
     * uq_posts_one_repost_per_user
     *
     * means duplicate repost → 409.
     */

    case '23505':
      throw new RepositoryError(
        'CONFLICT',
        'The requested record already exists',
      );

    /*
     * Foreign-key violation.
     *
     * The service normally catches missing targets first,
     * but the DB remains the final integrity boundary.
     */

    case '23503':
      throw new RepositoryError(
        'REFERENCE_NOT_FOUND',
        'Referenced record was not found',
      );

    /*
     * CHECK constraint violation.
     *
     * The service validates normal requests first.
     * This is the database safety net.
     */

    case '23514':
      throw new RepositoryError(
        'INVALID_TARGET',
        'The requested write violates a database constraint',
      );

    default:
      /*
       * Do NOT log the complete PostgreSQL error object.
       *
       * It can contain SQL text/parameters.
       */

      throw new RepositoryError(
        'INTERNAL',
        'Database operation failed',
      );
  }
}
}