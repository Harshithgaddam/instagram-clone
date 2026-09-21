import { jest } from '@jest/globals';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  PostsService,
} from '../src/posts/posts.service';

import {
  RepositoryError,
} from '../src/data/repository.types';

describe(
  'C3 PostsService writes',
  () => {
    const DEMO_USER_ID =
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    const ORIGINAL_ID =
      '11111111-1111-4111-8111-111111111111';

    const REPLY_ID =
      '22222222-2222-4222-8222-222222222222';

    function createService(
      overrides: Record<string, unknown> = {},
    ) {
      const repository: any = {
        findById:
          jest.fn(),

        createPost:
          jest.fn(),

        getPostDetail:
          jest.fn(),

        setLike:
          jest.fn(),

        ...overrides,
      };

      const config =
        new ConfigService({
          demoUserId:
            DEMO_USER_ID,
        });

      const service =
        new PostsService(
          repository,
          config,
        );

      return {
        service,
        repository,
      };
    }

    // ==========================================================
    // ORIGINAL
    // ==========================================================

    it(
      'creates an original using DEMO_USER_ID',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.createPost.mockResolvedValue(
          {
            id: ORIGINAL_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'original',
            text: 'Hello',
            replyToId: null,
            repostOfId: null,
            createdAt:
              new Date(
                '2026-09-18T10:00:00.000Z',
              ),
          },
        );

        repository.getPostDetail.mockResolvedValue(
          {
            id: ORIGINAL_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'original',
            text: 'Hello',
            replyToId: null,
            repostOfId: null,
            createdAt:
              new Date(
                '2026-09-18T10:00:00.000Z',
              ),

            author: {
              id: DEMO_USER_ID,
              handle: 'demo',
              displayName: 'Demo',
              bio: null,
              avatarSmallUrl: null,
              avatarLargeUrl: null,
            },

            media: null,

            likeCount: 0,
            replyCount: 0,
            repostCount: 0,
            likedByViewer: false,

            referencedPost: null,
          },
        );

        const result =
          await service.createPost({
            kind: 'original',
            text:
              '  Hello  ',
          });

        expect(
          repository.createPost,
        ).toHaveBeenCalledWith({
          authorId:
            DEMO_USER_ID,

          kind: 'original',

          text: 'Hello',

          replyToId: null,

          repostOfId: null,
        });

        expect(
          result.item.id,
        ).toBe(ORIGINAL_ID);
      },
    );

    // ==========================================================
    // CALLER CANNOT CHOOSE AUTHOR
    // ==========================================================

    it(
      'rejects caller-selected authorId',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.createPost({
            kind: 'original',
            text: 'Hello',
            authorId:
              'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          }),
        ).rejects.toBeInstanceOf(
          UnprocessableEntityException,
        );
      },
    );

    // ==========================================================
    // CALLER CANNOT CHOOSE ID
    // ==========================================================

    it(
      'rejects caller-selected id',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.createPost({
            kind: 'original',
            text: 'Hello',
            id: ORIGINAL_ID,
          }),
        ).rejects.toBeInstanceOf(
          UnprocessableEntityException,
        );
      },
    );

    // ==========================================================
    // REPLY TARGET MUST EXIST
    // ==========================================================

    it(
      'returns 404 for missing reply target',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          null,
        );

        await expect(
          service.createPost({
            kind: 'reply',
            text: 'Reply',
            replyToId:
              ORIGINAL_ID,
          }),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    // ==========================================================
    // REPLY TARGET MUST BE ORIGINAL
    // ==========================================================

    it(
      'returns 422 when replying to a reply',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          {
            id: REPLY_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'reply',
            text: 'Existing reply',
            replyToId:
              ORIGINAL_ID,
            repostOfId: null,
            createdAt:
              new Date(),
          },
        );

        await expect(
          service.createPost({
            kind: 'reply',
            text: 'Nested reply',
            replyToId:
              REPLY_ID,
          }),
        ).rejects.toBeInstanceOf(
          UnprocessableEntityException,
        );
      },
    );

    // ==========================================================
    // REPOST TARGET MUST BE ORIGINAL
    // ==========================================================

    it(
      'returns 422 when reposting a repost',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          {
            id: REPLY_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'repost',
            text: null,
            replyToId: null,
            repostOfId:
              ORIGINAL_ID,
            createdAt:
              new Date(),
          },
        );

        await expect(
          service.createPost({
            kind: 'repost',
            repostOfId:
              REPLY_ID,
          }),
        ).rejects.toBeInstanceOf(
          UnprocessableEntityException,
        );
      },
    );

    // ==========================================================
    // LIKE
    // ==========================================================

    it(
      'likes using DEMO_USER_ID',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          {
            id: ORIGINAL_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'original',
            text: 'Hello',
            replyToId: null,
            repostOfId: null,
            createdAt:
              new Date(),
          },
        );

        repository.setLike.mockResolvedValue(
          {
            postId:
              ORIGINAL_ID,
            likedByViewer:
              true,
            likeCount: 3,
          },
        );

        const result =
          await service.likePost(
            ORIGINAL_ID,
          );

        expect(
          repository.setLike,
        ).toHaveBeenCalledWith(
          ORIGINAL_ID,
          DEMO_USER_ID,
          true,
        );

        expect(
          result.likedByViewer,
        ).toBe(true);
      },
    );

    // ==========================================================
    // LIKE REPOST REJECTED
    // ==========================================================

    it(
      'rejects liking a repost',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          {
            id: REPLY_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'repost',
            text: null,
            replyToId: null,
            repostOfId:
              ORIGINAL_ID,
            createdAt:
              new Date(),
          },
        );

        await expect(
          service.likePost(
            REPLY_ID,
          ),
        ).rejects.toBeInstanceOf(
          UnprocessableEntityException,
        );

        expect(
          repository.setLike,
        ).not.toHaveBeenCalled();
      },
    );

    // ==========================================================
    // MISSING LIKE TARGET
    // ==========================================================

    it(
      'returns 404 when liking a missing post',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          null,
        );

        await expect(
          service.likePost(
            ORIGINAL_ID,
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    // ==========================================================
    // UNLIKE
    // ==========================================================

    it(
      'unlikes using desiredState=false',
      async () => {
        const {
          service,
          repository,
        } =
          createService();

        repository.findById.mockResolvedValue(
          {
            id: ORIGINAL_ID,
            authorId:
              DEMO_USER_ID,
            kind: 'original',
            text: 'Hello',
            replyToId: null,
            repostOfId: null,
            createdAt:
              new Date(),
          },
        );

        repository.setLike.mockResolvedValue(
          {
            postId:
              ORIGINAL_ID,
            likedByViewer:
              false,
            likeCount: 0,
          },
        );

        const result =
          await service.unlikePost(
            ORIGINAL_ID,
          );

        expect(
          repository.setLike,
        ).toHaveBeenCalledWith(
          ORIGINAL_ID,
          DEMO_USER_ID,
          false,
        );

        expect(
          result.likedByViewer,
        ).toBe(false);
      },
    );
  },
);