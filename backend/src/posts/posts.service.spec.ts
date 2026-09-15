import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;

  const postRepository = {
    findById: jest.fn(),
    findMediaByPostId: jest.fn(),
    countLikes: jest.fn(),
    countReplies: jest.fn(),
    isLikedByUser: jest.fn(),
  };

  const userRepository = {
    findById: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    configService.get.mockReturnValue(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );

    service = new PostsService(
      postRepository as any,
      userRepository as any,
      configService as any,
    );
  });

  it('should return a post with metadata', async () => {
    const post = {
      id: '11111111-1111-4111-8111-111111111111',
      kind: 'original',
      authorId:
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      text: 'Hello world',
      createdAt:
        '2026-09-01T10:00:00.000Z',
    };

    postRepository.findById.mockResolvedValue(
      post,
    );

    userRepository.findById.mockResolvedValue({
      id: post.authorId,
      handle: 'asha',
      displayName: 'Asha',
      bio: 'Hello',
      avatar: {
        smallUrl: '/fixtures/asha-48.jpg',
        largeUrl: '/fixtures/asha-96.jpg',
      },
    });

    postRepository.findMediaByPostId.mockResolvedValue(
      [],
    );

    postRepository.countLikes.mockResolvedValue(2);
    postRepository.countReplies.mockResolvedValue(1);
    postRepository.isLikedByUser.mockResolvedValue(
      true,
    );

    const result = await service.getPost(
      post.id,
    );

    expect(result.item).toEqual({
      id: post.id,
      kind: 'original',
      text: 'Hello world',
      createdAt:
        '2026-09-01T10:00:00.000Z',
      author: {
        id: post.authorId,
        handle: 'asha',
        displayName: 'Asha',
        avatar: {
          smallUrl: '/fixtures/asha-48.jpg',
          largeUrl: '/fixtures/asha-96.jpg',
        },
      },
      media: [],
      likeCount: 2,
      replyCount: 1,
      likedByViewer: true,
      replyToId: null,
      repostOfId: null,
    });
  });

  it('should throw NotFoundException for a missing post', async () => {
    postRepository.findById.mockResolvedValue(
      null,
    );

    await expect(
      service.getPost(
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});