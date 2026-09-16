import {
  INestApplication,
} from '@nestjs/common';

import {
  Test,
} from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('A3 API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleRef.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns ok', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/health/live')
        .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
    });
  });

  it('GET /feed returns paginated originals', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/feed?limit=10')
        .expect(200);

    expect(
      response.body.items,
    ).toHaveLength(10);

    expect(
      response.body.hasMore,
    ).toBe(true);

    expect(
      response.body.nextCursor,
    ).toEqual(
      expect.any(String),
    );

    expect(
      response.body.items[0],
    ).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        kind: 'original',
        text: expect.any(String),
        createdAt: expect.any(String),
        author: expect.any(Object),
        media: expect.any(Array),
        likeCount: expect.any(Number),
        replyCount: expect.any(Number),
        likedByViewer:
          expect.any(Boolean),
        replyToId: null,
        repostOfId: null,
      }),
    );
  });

  it('rejects page pagination', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/feed?page=1')
        .expect(400);

    expect(
      response.body.error.code,
    ).toBe('VALIDATION_ERROR');

    expect(
      response.body.requestId,
    ).toEqual(
      expect.any(String),
    );
  });

  it('rejects invalid limit', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/feed?limit=0')
        .expect(400);

    expect(
      response.body.error.code,
    ).toBe('VALIDATION_ERROR');

    expect(
      response.body.requestId,
    ).toEqual(
      expect.any(String),
    );
  });

  it('rejects repeated limit', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/feed?limit=1&limit=2')
      .expect(400);
  });

  it('rejects invalid cursor', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/feed?cursor=garbage')
      .expect(400);
  });

  it('returns existing post', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get(
          '/posts/11111111-1111-4111-8111-111111111111',
        )
        .expect(200);

    expect(
      response.body.item.id,
    ).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('returns 404 for missing post', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get(
          '/posts/99999999-9999-4999-8999-999999999999',
        )
        .expect(404);

    expect(
      response.body.error.code,
    ).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid post id', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/posts/hello')
      .expect(400);
  });

  it('returns existing user', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get(
          '/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        )
        .expect(200);

    expect(
      response.body.item.id,
    ).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('returns 404 for missing user', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get(
          '/users/99999999-9999-4999-8999-999999999999',
        )
        .expect(404);

    expect(
      response.body.error.code,
    ).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid user id', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/users/hello')
      .expect(400);
  });

  it('returns request id header', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/health/live')
        .expect(200);

    expect(
      response.headers[
        'x-request-id'
      ],
    ).toEqual(
      expect.any(String),
    );
  });

  it('preserves supplied request id', async () => {
    const requestId =
      'test-request-123';

    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/health/live')
        .set(
          'X-Request-Id',
          requestId,
        )
        .expect(200);

    expect(
      response.headers[
        'x-request-id'
      ],
    ).toBe(requestId);
  });
});