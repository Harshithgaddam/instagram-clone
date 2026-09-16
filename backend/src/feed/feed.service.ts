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
    const posts =
      await this.postRepository.findAll(options);

    const limit = options?.limit ?? 10;

    const hasMore =
      posts.length > limit;

    const postsToReturn =
      posts.slice(0, limit);

    const items =
      await Promise.all(
        postsToReturn.map((post) =>
          this.mapPost(post.id),
        ),
      );

    let nextCursor: string | null = null;

    if (
      hasMore &&
      postsToReturn.length > 0
    ) {
      const lastPost =
        postsToReturn[
          postsToReturn.length - 1
        ];

      nextCursor = encodeCursor(
        lastPost.createdAt,
        lastPost.id,
      );
    }

    return {
      items,
      nextCursor,
      hasMore,
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

      createdAt: post.createdAt,

      author: {
        id: author.id,
        handle: author.handle,
        displayName: author.displayName,
        avatar: author.avatar,
      },

      media:
        post.kind === 'repost'
          ? []
          : media.map((item) => ({
              id: item.id,
              altText: item.altText,
              width: item.width,
              height: item.height,
              position: item.position,
              smallUrl: item.smallUrl,
              largeUrl: item.largeUrl,
            })),

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