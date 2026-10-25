import { jest } from '@jest/globals';

import { FeedController } from './feed.controller';
import { FeedResponseDto } from './feed-response.dto';

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