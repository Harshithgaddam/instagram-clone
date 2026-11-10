import { jest } from '@jest/globals';

import { FeedController } from './feed.controller';
import { FeedResponseDto } from './feed-response.dto';
import { encodeCursor } from '../common/cursor';

describe('FeedController', () => {
  let controller: FeedController;
  const user = {
    userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    sessionId: 'session-id',
    handle: 'test_user',
    displayName: 'Test User',
  };

  const feedService = {
    getPosts: jest.fn<
      () => Promise<FeedResponseDto>
    >(),
    getPublicPosts: jest.fn<
      () => Promise<FeedResponseDto>
    >(),
  };
  

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new FeedController(
      feedService as any,
    );

    feedService.getPosts.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
      feedMode: 'personalized',
    });
  });

  it('should use the default limit of 10', async () => {
    await controller.getFeed({}, user);

    expect(
      feedService.getPosts,
    ).toHaveBeenCalledWith(user.userId, {
        kind: 'original',
        limit: 10,
        cursorCreatedAt: undefined,
        cursorId: undefined,
      });
  });

  it('should route the public listing through the shared pagination parser', async () => {
    await controller.getPublicFeed({ limit: '5' }, user);

    expect(feedService.getPublicPosts).toHaveBeenCalledWith(
      user.userId,
      {
        kind: 'original',
        limit: 5,
        cursorCreatedAt: undefined,
        cursorId: undefined,
      },
    );
  });

  it('should preserve the feed group in the pagination cursor', async () => {
    const createdAt = '2026-10-01T10:00:00.000Z';
    const id = '11111111-1111-4111-8111-111111111111';

    await controller.getFeed(
      { cursor: encodeCursor(createdAt, id, 1) },
      user,
    );

    expect(feedService.getPosts).toHaveBeenCalledWith(
      user.userId,
      expect.objectContaining({
        cursorCreatedAt: new Date(createdAt),
        cursorId: id,
        cursorFeedGroup: 1,
      }),
    );
  });

  it('should accept a valid limit', async () => {
    await controller.getFeed({
      limit: '5',
    }, user);

    expect(
      feedService.getPosts,
    ).toHaveBeenCalledWith(user.userId, {
        kind: 'original',
        limit: 5,
        cursorCreatedAt: undefined,
        cursorId: undefined,
      });
  });

  it('should reject limit 0', async () => {
    await expect(
      controller.getFeed({
        limit: '0',
      },user),
    ).rejects.toThrow();
  });

  it('should reject limit greater than 50', async () => {
    await expect(
      controller.getFeed({
        limit: '51',
      },user),
    ).rejects.toThrow();
  });

  it('should reject legacy page pagination', async () => {
    await expect(
      controller.getFeed({
        page: '1',
      },user),
    ).rejects.toThrow();
  });

  it('should reject repeated limit', async () => {
    await expect(
      controller.getFeed({
        limit: ['5', '10'],
      },user),
    ).rejects.toThrow();
  });

  it('should reject unknown query parameters', async () => {
    await expect(
      controller.getFeed({
        foo: 'bar',
      },user),
    ).rejects.toThrow();
  });
});