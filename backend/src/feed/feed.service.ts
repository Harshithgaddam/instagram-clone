import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  POST_REPOSITORY,
  USER_REPOSITORY,
} from '../data/data.tokens';

import type {
  FindPostsOptions,
  PostRepository,
} from '../data/post.repository';

import type { UserRepository } from '../data/user.repository';

import {
  FeedPostResponseDto,
  FeedResponseDto,
} from './feed-response.dto';

import { encodeCursor } from '../common/cursor';

interface DatabaseMediaImage {
  alt_text: string;
  small_url: string;
  large_url: string;
}

@Injectable()
export class FeedService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,

    private readonly configService: ConfigService,
  ) {}

 async getPosts(
  options?: FindPostsOptions,
): Promise<FeedResponseDto> {
  const limit = options?.limit ?? 10;

  const cursor =
    options?.cursorCreatedAt &&
    options?.cursorId
      ? {
          createdAt: options.cursorCreatedAt,
          id: options.cursorId,
        }
      : null;

  const viewerId =
    this.configService.getOrThrow<string>(
      'demoUserId',
    );

  const result =
    await this.postRepository.listOriginalFeed(
      cursor,
      limit,
      viewerId,
    );

  const items = await Promise.all(
    result.items.map((post) =>
      this.mapPost(post.id),
    ),
  );

  const nextCursor = result.nextCursor
    ? encodeCursor(
        result.nextCursor.createdAt.toISOString(),
        result.nextCursor.id,
      )
    : null;

  return {
    items,
    nextCursor,
    hasMore: result.hasMore,
  };
}

  private async mapPost(
    postId: string,
  ): Promise<FeedPostResponseDto> {
    const post =
      await this.postRepository.findById(
        postId,
      );

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    const author =
      await this.userRepository.findById(
        post.authorId,
      );

    if (!author) {
      throw new NotFoundException(
        'Post author not found',
      );
    }

    const [
      media,
      likeCount,
      replyCount,
    ] = await Promise.all([
      this.postRepository.findMediaByPostId(
        post.id,
      ),
      this.postRepository.countLikes(
        post.id,
      ),
      this.postRepository.countReplies(
        post.id,
      ),
    ]);

    const demoUserId =
      this.configService.get<string>(
        'demoUserId',
      ) ?? '';

    const likedByViewer =
      await this.postRepository.isLikedByUser(
        post.id,
        demoUserId,
      );

    return {
      id: post.id,
      kind: post.kind,

      text:
        post.kind === 'repost'
          ? null
          : post.text,

      createdAt: post.createdAt.toISOString(),

      author: {
  id: author.id,
  handle: author.handle,
  displayName: author.displayName,
  bio: author.bio,
  avatarSmallUrl: author.avatarSmallUrl,
  avatarLargeUrl: author.avatarLargeUrl,
},

  media: media.flatMap((item) =>
  (item.images as unknown as DatabaseMediaImage[]).map(
    (image) => ({
      id: item.id,
      altText: image.alt_text,
      smallUrl: image.small_url,
      largeUrl: image.large_url,
    }),
  ),
),

      likeCount,
      replyCount,
      likedByViewer,

      replyToId:
        post.replyToId ?? null,

      repostOfId:
        post.repostOfId ?? null,
    };
  }
}