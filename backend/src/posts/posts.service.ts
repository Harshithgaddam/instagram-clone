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

import type { PostRepository } from '../data/post.repository';
import type { UserRepository } from '../data/user.repository';

import {
  PostDetailResponseDto,
  PostResponseDto,
} from './post-response.dto';

@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,

    private readonly configService: ConfigService,
  ) {}

  async getPost(
    id: string,
  ): Promise<PostDetailResponseDto> {
    const post =
      await this.postRepository.findById(id);

    if (!post) {
      throw new NotFoundException(
        'Post not found',
      );
    }

    const response =
      await this.mapPost(post.id);

    const result: PostDetailResponseDto = {
      item: response,
    };

    const referencedPostId =
      post.replyToId ??
      post.repostOfId;

    if (referencedPostId) {
      const referencedPost =
        await this.postRepository.findById(
          referencedPostId,
        );

      if (referencedPost) {
        result.referencedPost =
          await this.mapPost(
            referencedPost.id,
          );
      }
    }

    return result;
  }

  private async mapPost(
    postId: string,
  ): Promise<PostResponseDto> {
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