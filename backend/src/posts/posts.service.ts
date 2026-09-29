// src/posts/posts.service.ts

import {
  Inject,
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  POST_REPOSITORY,
} from '../data/data.tokens';

import type {
  PostRepository,
} from '../data/post.repository';

import {
  RepositoryError,
  type CreatePostCommand,
  type FeedPostResult,
  type PostDetailResult,
} from '../data/repository.types';

import {
  PostDetailResponseDto,
  PostResponseDto,
} from './post-response.dto';

import {
  FeedResponseDto,
} from '../feed/feed-response.dto';

import { encodeCursor } from '../common/cursor';

import {
  CreatePostDto,
} from './create-post.dto';

interface DatabaseMediaImage {
  alt_text: string;
  small_url: string;
  large_url: string;
}

@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,

    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // GET /posts/:id
  // ============================================================

  async getPost(
    id: string,
  ): Promise<PostDetailResponseDto> {
    const viewerId =
      this.getDemoUserId();

    const result =
      await this.postRepository.getPostDetail(
        id,
        viewerId,
      );

    if (!result) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    return {
      item: this.mapPost(result),
      ...(result.referencedPost
        ? {
            referencedPost:
              this.mapPost(
                result.referencedPost,
              ),
          }
        : {}),
    };
  }

  async getReplies(
    postId: string,
  ): Promise<FeedResponseDto> {
    const viewerId =
      this.getDemoUserId();

    const result =
      await this.postRepository.listDirectReplies(
        postId,
        null,
        50,
        viewerId,
      );

    return {
      items: result.items.map((post) =>
        this.mapPost(post),
      ),
      nextCursor: result.nextCursor
        ? encodeCursor(
            result.nextCursor.createdAt.toISOString(),
            result.nextCursor.id,
          )
        : null,
      hasMore: result.hasMore,
    };
  }

  // ============================================================
  // POST /posts
  // ============================================================

  async  createPost(
    body: unknown,
  ): Promise<PostDetailResponseDto> {
    const dto =
      this.validateCreatePostBody(body);

    const authorId =
      dto.authorId;

    /*
     * Domain validation happens here, before the repository
     * attempts the write.
     *
     * The database FK guarantees that the referenced ID exists,
     * but it cannot guarantee that the referenced row has
     * kind = 'original'. Therefore the service checks it.
     */

    if (
      dto.kind === 'reply' ||
      dto.kind === 'repost'
    ) {
      const targetId =
        dto.kind === 'reply'
          ? dto.replyToId!
          : dto.repostOfId!;

      const target =
        await this.postRepository.findById(
          targetId,
        );

      if (!target) {
        throw new NotFoundException(
          'Referenced post not found',
        );
      }

      if (target.kind !== 'original') {
        throw new UnprocessableEntityException(
          'The target post must be an original',
        );
      }
    }

    const command: CreatePostCommand = {
      authorId,

      kind: dto.kind,

      text:
        dto.kind === 'repost'
          ? null
          : dto.text!.trim(),

      replyToId:
        dto.kind === 'reply'
          ? dto.replyToId!
          : null,

      repostOfId:
        dto.kind === 'repost'
          ? dto.repostOfId!
          : null,
    };

    let created;

    try {
      created =
        await this.postRepository.createPost(
          command,
        );
    } catch (error) {
      this.handleRepositoryError(error);
    }

    /*
     * createPost() returns the persisted row.
     *
     * The API contract requires the complete post item,
     * including author, media, counts and viewer state.
     *
     * Therefore we read the authoritative persisted result.
     */

    const result =
      await this.postRepository.getPostDetail(
        created.id,
        authorId,
      );

    if (!result) {
      throw new InternalServerErrorException(
        'Created post could not be read back',
      );
    }

    return {
      item: this.mapPost(result),
      ...(result.referencedPost
        ? {
            referencedPost:
              this.mapPost(
                result.referencedPost,
              ),
          }
        : {}),
    };
  }

  // ============================================================
  // PUT /posts/:id/like
  // ============================================================

  async likePost(
    postId: string,
  ) {
    const viewerId =
      this.getDemoUserId();

    await this.validateLikeTarget(
      postId,
    );

    try {
      return await this.postRepository.setLike(
        postId,
        viewerId,
        true,
      );
    } catch (error) {
      this.handleRepositoryError(error);
    }
  }

  // ============================================================
  // DELETE /posts/:id/like
  // ============================================================

  async unlikePost(
    postId: string,
  ) {
    const viewerId =
      this.getDemoUserId();

    await this.validateLikeTarget(
      postId,
    );

    try {
      return await this.postRepository.setLike(
        postId,
        viewerId,
        false,
      );
    } catch (error) {
      this.handleRepositoryError(error);
    }
  }

  // ============================================================
  // LIKE TARGET VALIDATION
  // ============================================================

  private async validateLikeTarget(
    postId: string,
  ): Promise<void> {
    const post =
      await this.postRepository.findById(
        postId,
      );

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    /*
     * The product rule says:
     *
     * original → can like
     * reply    → can like
     * repost   → cannot like
     */

    if (
      post.kind !== 'original' &&
      post.kind !== 'reply'
    ) {
      throw new UnprocessableEntityException(
        'Repost rows cannot be liked',
      );
    }
  }

  // ============================================================
  // REQUEST VALIDATION
  // ============================================================

  private validateCreatePostBody(
    body: unknown,
  ): CreatePostDto {
    if (
      body === null ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new UnprocessableEntityException(
        'Request body must be a JSON object',
      );
    }

    const value =
      body as Record<string, unknown>;

    const allowedFields =
      new Set([
        'authorId',
        'kind',
        'text',
        'replyToId',
        'repostOfId',
      ]);

    for (const key of Object.keys(value)) {
      if (!allowedFields.has(key)) {
        throw new UnprocessableEntityException(
          `Unknown field: ${key}`,
        );
      }
    }

    if (typeof value.authorId !== 'string') {
      throw new UnprocessableEntityException(
        'authorId is required',
      );
    }

    this.validateUuid(
      value.authorId,
      'authorId',
    );

    const kind =
      value.kind;

    if (
      kind !== 'original' &&
      kind !== 'reply' &&
      kind !== 'repost'
    ) {
      throw new UnprocessableEntityException(
        'kind must be original, reply or repost',
      );
    }

    // ----------------------------------------------------------
    // ORIGINAL
    // ----------------------------------------------------------

    if (kind === 'original') {
      if (
        typeof value.text !== 'string'
      ) {
        throw new UnprocessableEntityException(
          'text is required for an original post',
        );
      }

      if (
        value.replyToId !== undefined ||
        value.repostOfId !== undefined
      ) {
        throw new UnprocessableEntityException(
          'original posts cannot contain replyToId or repostOfId',
        );
      }

      const text =
        this.validateText(
          value.text,
        );

      return {
        authorId: value.authorId,
        kind,
        text,
      };
    }

    // ----------------------------------------------------------
    // REPLY
    // ----------------------------------------------------------

    if (kind === 'reply') {
      if (
        typeof value.text !== 'string'
      ) {
        throw new UnprocessableEntityException(
          'text is required for a reply',
        );
      }

      if (
        typeof value.replyToId !== 'string'
      ) {
        throw new UnprocessableEntityException(
          'replyToId is required for a reply',
        );
      }

      this.validateUuid(
        value.replyToId,
        'replyToId',
      );

      if (
        value.repostOfId !== undefined
      ) {
        throw new UnprocessableEntityException(
          'reply cannot contain repostOfId',
        );
      }

      const text =
        this.validateText(
          value.text,
        );

      return {
        authorId: value.authorId,
        kind,
        text,
        replyToId:
          value.replyToId,
      };
    }

    // ----------------------------------------------------------
    // REPOST
    // ----------------------------------------------------------

    if (
      typeof value.repostOfId !== 'string'
    ) {
      throw new UnprocessableEntityException(
        'repostOfId is required for a repost',
      );
    }

    this.validateUuid(
      value.repostOfId,
      'repostOfId',
    );

    if (
      value.text !== undefined
    ) {
      throw new UnprocessableEntityException(
        'repost cannot contain text',
      );
    }

    if (
      value.replyToId !== undefined
    ) {
      throw new UnprocessableEntityException(
        'repost cannot contain replyToId',
      );
    }

    return {
      authorId: value.authorId,
      kind,
      repostOfId:
        value.repostOfId,
    };
  }

  // ============================================================
  // TEXT VALIDATION
  // ============================================================

  private validateText(
    value: string,
  ): string {
    const text =
      value.trim();

    const length =
      [...text].length;

    if (
      length < 1 ||
      length > 280
    ) {
      throw new UnprocessableEntityException(
        'text must contain 1 to 280 Unicode characters',
      );
    }

    return text;
  }

  // ============================================================
  // UUID VALIDATION
  // ============================================================

  private validateUuid(
    value: string,
    field: string,
  ): void {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4.test(value)) {
      throw new UnprocessableEntityException(
        `${field} must be a valid UUID`,
      );
    }
  }

  // ============================================================
  // DEMO USER
  // ============================================================

  private getDemoUserId(): string {
    return this.configService.getOrThrow<string>(
      'demoUserId',
    );
  }

  // ============================================================
  // API MAPPING
  // ============================================================

  private mapPost(
    post: FeedPostResult,
  ): PostResponseDto {
    return {
      id: post.id,

      kind: post.kind,

      text: post.text,

      createdAt:
        post.createdAt.toISOString(),

      author: {
        id: post.author.id,
        handle: post.author.handle,
        displayName:
          post.author.displayName,
        bio: post.author.bio,
        avatarSmallUrl:
          post.author.avatarSmallUrl,
        avatarLargeUrl:
          post.author.avatarLargeUrl,
      },

      media: post.media
  ? (post.media.images as unknown as DatabaseMediaImage[]).map(
      (image) => ({
        id: post.media!.id,
        altText: image.alt_text,
        smallUrl: image.small_url,
        largeUrl: image.large_url,
      }),
    )
  : [],
      likeCount:
        post.likeCount,

      replyCount:
        post.replyCount,

      likedByViewer:
        post.likedByViewer,

      replyToId:  
        post.replyToId,

      repostOfId:
        post.repostOfId,
    };
  }

  // ============================================================
  // REPOSITORY ERROR → HTTP ERROR
  // ============================================================

  private handleRepositoryError(
    error: unknown,
  ): never {
    if (
      error instanceof RepositoryError
    ) {
      switch (error.code) {
        case 'NOT_FOUND':
        case 'REFERENCE_NOT_FOUND':
          throw new NotFoundException(
            error.message,
          );

        case 'CONFLICT':
          throw new ConflictException(
            error.message,
          );

        case 'INVALID_TARGET':
          throw new UnprocessableEntityException(
            error.message,
          );

        case 'INTERNAL':
        default:
          throw new InternalServerErrorException(
            'Internal server error',
          );
      }
    }

    throw new InternalServerErrorException(
      'Internal server error',
    );
  }
}