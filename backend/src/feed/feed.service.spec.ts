import { jest } from '@jest/globals';

import { FeedService } from './feed.service';

import type {
  FindPostsOptions,
  Media,
  Post,
} from '../data/post.repository';

import type {
  User,
} from '../data/user.repository';

describe('FeedService', () => {
  const fakePostRepository = {
    findAll: jest.fn<
      (
        options?: FindPostsOptions,
      ) => Promise<Post[]>
    >(),

    findById: jest.fn<
      (
        id: string,
      ) => Promise<Post | null>
    >(),

    findMediaByPostId: jest.fn<
      (
        postId: string,
      ) => Promise<Media[]>
    >(),

    countLikes: jest.fn<
      (
        postId: string,
      ) => Promise<number>
    >(),

    countReplies: jest.fn<
      (
        postId: string,
      ) => Promise<number>
    >(),

    isLikedByUser: jest.fn<
      (
        postId: string,
        userId: string,
      ) => Promise<boolean>
    >(),
  };

  const fakeUserRepository = {
    findById: jest.fn<
      (
        id: string,
      ) => Promise<User | null>
    >(),
  };

  const fakeConfigService = {
    get: jest.fn<
      (
        key: string,
      ) => string | undefined
    >(),
  };

  let service: FeedService;

  beforeEach(() => {
    jest.clearAllMocks();

    fakeConfigService.get.mockReturnValue(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );

    service = new FeedService(
      fakePostRepository as any,
      fakeUserRepository as any,
      fakeConfigService as any,
    );
  });

  it(
    'should map posts returned by the repository',
    async () => {
      fakePostRepository.findAll.mockResolvedValue([
        {
          id:
            '11111111-1111-4111-8111-111111111111',

          kind: 'original',

          authorId:
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',

          text: 'Test post',

          createdAt:
            '2026-09-01T10:00:00.000Z',
        },
      ]);

      fakePostRepository.findById.mockResolvedValue({
        id:
          '11111111-1111-4111-8111-111111111111',

        kind: 'original',

        authorId:
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',

        text: 'Test post',

        createdAt:
          '2026-09-01T10:00:00.000Z',
      });

      fakeUserRepository.findById.mockResolvedValue({
        id:
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',

        handle: 'asha',

        displayName: 'Asha',

        bio: 'Test bio',

        avatar: {
          smallUrl: '/small.jpg',
          largeUrl: '/large.jpg',
        },
      });

      fakePostRepository.findMediaByPostId
        .mockResolvedValue([]);

      fakePostRepository.countLikes
        .mockResolvedValue(2);

      fakePostRepository.countReplies
        .mockResolvedValue(1);

      fakePostRepository.isLikedByUser
        .mockResolvedValue(false);

      const result =
        await service.getPosts({
          kind: 'original',
          limit: 10,
        });

      expect(result.items).toHaveLength(1);

      expect(
        result.items[0],
      ).toMatchObject({
        id:
          '11111111-1111-4111-8111-111111111111',

        kind: 'original',

        text: 'Test post',

        likeCount: 2,

        replyCount: 1,

        likedByViewer: false,
      });

      expect(
        fakePostRepository.findAll,
      ).toHaveBeenCalledWith({
        kind: 'original',
        limit: 10,
      });
    },
  );
});