import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  FindPostsOptions,
  Media,
  Post,
  PostRepository,
} from './post.repository';

import { posts, media, likes } from './fixtures';

@Injectable()
export class FixturePostRepository
  implements PostRepository
{
  private readFailureForTests = false;

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /**
   * Test-only override.
   *
   * Production code never enables this automatically.
   */
  setReadFailureForTests(
    shouldFail: boolean,
  ): void {
    this.readFailureForTests = shouldFail;
  }

  private async simulateIo(): Promise<void> {
    const simulatedIoMs =
      this.configService.get<number>(
        'simulatedIoMs',
      ) ?? 0;

    await delay(simulatedIoMs);

    if (this.readFailureForTests) {
      throw new Error(
        'Controlled repository read failure',
      );
    }
  }

  async findAll(
    options: FindPostsOptions = {},
  ): Promise<Post[]> {
    await this.simulateIo();

    let result = [...posts];

    if (options.authorId) {
      result = result.filter(
        (post) =>
          post.authorId === options.authorId,
      );
    }

    if (options.kind) {
      result = result.filter(
        (post) =>
          post.kind === options.kind,
      );
    }

    result.sort((a, b) => {
      const createdAtDifference =
        b.createdAt.localeCompare(
          a.createdAt,
        );

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return b.id.localeCompare(a.id);
    });

    if (
      options.cursorCreatedAt &&
      options.cursorId
    ) {
      result = result.filter((post) => {
        if (
          post.createdAt <
          options.cursorCreatedAt!
        ) {
          return true;
        }

        if (
          post.createdAt >
          options.cursorCreatedAt!
        ) {
          return false;
        }

        return (
          post.id <
          options.cursorId!
        );
      });
    }

    const limit =
      options.limit ?? result.length;

    return result
      .slice(0, limit + 1)
      .map((post) => clonePost(post));
  }

  async findById(
    id: string,
  ): Promise<Post | null> {
    await this.simulateIo();

    const post = posts.find(
      (item) => item.id === id,
    );

    return post
      ? clonePost(post)
      : null;
  }

  async findMediaByPostId(
    postId: string,
  ): Promise<Media[]> {
    await this.simulateIo();

    return media
      .filter(
        (item) =>
          item.postId === postId,
      )
      .sort(
        (a, b) =>
          a.position - b.position,
      )
      .map((item) => cloneMedia(item));
  }

  async countLikes(
    postId: string,
  ): Promise<number> {
    await this.simulateIo();

    return likes.filter(
      (like) =>
        like.postId === postId,
    ).length;
  }

  async countReplies(
    postId: string,
  ): Promise<number> {
    await this.simulateIo();

    return posts.filter(
      (post) =>
        post.kind === 'reply' &&
        post.replyToId === postId,
    ).length;
  }

  async isLikedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    await this.simulateIo();

    return likes.some(
      (like) =>
        like.postId === postId &&
        like.userId === userId,
    );
  }
}

function clonePost(
  post: Post,
): Post {
  return {
    ...post,
  };
}

function cloneMedia(
  item: Media,
): Media {
  return {
    ...item,
  };
}

function delay(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms),
  );
}