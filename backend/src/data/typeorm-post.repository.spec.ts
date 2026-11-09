import { jest } from '@jest/globals';

import { TypeOrmPostRepository } from './typeorm-post.repository';

describe('TypeOrmPostRepository.listOriginalFeed', () => {
  let database: {
    getRepository: jest.Mock<(...args: any[]) => any>;
    query: jest.Mock<(...args: any[]) => any>;
  };
  let queryBuilder: Record<
    string,
    jest.Mock<(...args: any[]) => any>
  >;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [],
        raw: [],
      }),
    };
    database = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        create: jest.fn((entity) => entity),
      }),
      query: jest.fn(),
    };
  });

  const mockFeedQueries = (
    hasFollowing: boolean,
    pageRows: unknown[] = [],
  ) => {
    database.query
      .mockResolvedValueOnce([{ hasFollowing }])
      .mockResolvedValueOnce(pageRows);
  };

  it('limits personalized pages to the viewer and accepted active follows', async () => {
    mockFeedQueries(true);
    const repository = new TypeOrmPostRepository(database as any);

    const page = await repository.listOriginalFeed(null, 10, 'viewer-id');

    const [feedQuery, feedParameters] = database.query.mock.calls[1];
    expect(feedQuery).toContain('author.is_private = false');
    expect(feedQuery).toContain('feed_follow.status = $7');
    expect(feedQuery).toContain('ORDER BY feed_group ASC, created_at DESC, id DESC');
    expect(feedParameters).toEqual([
      'original',
      'viewer-id',
      null,
      null,
      null,
      11,
      'accepted',
    ]);
    expect(feedQuery).toContain('WHERE post.kind = $1');
    expect(feedQuery).not.toContain('post.kind = $8');
    expect(feedQuery).not.toContain('post.author_id = $2');
    expect(page.feedMode).toBe('personalized');
  });

  it('uses only public authors plus the viewer for zero-follow pages', async () => {
    mockFeedQueries(false);
    const repository = new TypeOrmPostRepository(database as any);

    const page = await repository.listOriginalFeed(null, 10, 'viewer-id');

    expect(page.feedMode).toBe('public_fallback');
  });

  it('uses the cursor feed group to continue the public portion', async () => {
    mockFeedQueries(true);
    const repository = new TypeOrmPostRepository(database as any);

    const cursorDate = new Date('2026-10-01T10:00:00.000Z');
    const cursorId = '11111111-1111-4111-8111-111111111111';
    await repository.listOriginalFeed(
      {
        createdAt: cursorDate,
        id: cursorId,
        feedGroup: 1,
      },
      10,
      'viewer-id',
    );

    const [feedQuery, feedParameters] = database.query.mock.calls[1];
    expect(feedQuery).toContain('feed_group > $3');
    expect(feedParameters).toEqual([
      'original',
      'viewer-id',
      1,
      cursorDate,
      cursorId,
      11,
      'accepted',
    ]);
  });

  it('continues legacy cursors by the timestamp and id tuple', async () => {
    mockFeedQueries(true);
    const repository = new TypeOrmPostRepository(database as any);

    await repository.listOriginalFeed(
      {
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        id: '11111111-1111-4111-8111-111111111111',
      },
      10,
      'viewer-id',
      'repost',
    );

    const [feedQuery, feedParameters] = database.query.mock.calls[1];
    expect(feedQuery).toContain('$3::integer IS NULL');
    expect(feedQuery).toContain(
      '(created_at, id) < ($4::timestamptz, $5::uuid)',
    );
    expect(feedParameters[2]).toBeNull();
    expect(feedParameters[3]).toEqual(
      new Date('2026-10-01T10:00:00.000Z'),
    );
  });

  it('attaches the selected group to the next cursor', async () => {
    const firstPostId = '11111111-1111-4111-8111-111111111111';
    const publicPostId = '22222222-2222-4222-8222-222222222222';
    const createdAt = new Date('2026-10-01T10:00:00.000Z');
    mockFeedQueries(true, [
      {
        id: firstPostId,
        author_id: 'author-1',
        kind: 'original',
        reply_to_id: null,
        repost_of_id: null,
        text: 'followed post',
        created_at: createdAt,
        feed_group: 0,
      },
      {
        id: publicPostId,
        author_id: 'author-2',
        kind: 'original',
        reply_to_id: null,
        repost_of_id: null,
        text: 'public post',
        created_at: createdAt,
        feed_group: 1,
      },
    ]);
    const pageBuilder = jest.fn().mockResolvedValue({
      items: [{ id: publicPostId, createdAt }],
      nextCursor: { id: publicPostId, createdAt },
      hasMore: true,
    });
    const repository = new TypeOrmPostRepository(database as any);
    (repository as any).buildFeedPage = pageBuilder;

    const page = await repository.listOriginalFeed(null, 1, 'viewer-id');

    expect(page.nextCursor).toMatchObject({
      id: publicPostId,
      feedGroup: 1,
    });
  });

  it('keeps the public feed limited to public, active authors with the same ordering', async () => {
    const repository = new TypeOrmPostRepository(database as any);

    const page = await repository.listPublicFeed(null, 10, 'viewer-id');

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'author.is_private = false',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'post.created_at',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'post.id',
      'DESC',
    );
    expect(page.feedMode).toBe('public');
  });
});