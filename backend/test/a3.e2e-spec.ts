import {
  Test,
} from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
describe('A3 API', () => {
  let app: INestApplication;
  let cookie: string;
  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleRef.createNestApplication();

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
    await app.init();
    const handle = `t_${Date.now().toString(36)}`.slice(0, 20);
    const password = `Pw-${crypto.randomUUID()}`;
    await request(app.getHttpServer())
    .post('/auth/register')
    .send({ handle, displayName: 'Test User', password })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ handle, password })
    .expect(200);

  cookie = (login.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  },30000);

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
    const response = await request(app.getHttpServer())
  .get('/feed').set('Cookie', cookie);

console.log('Feed status:', response.status);
console.log('Feed response:', response.body);

expect(response.status).toBe(200);

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
        .set('Cookie', cookie)
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
        .set('Cookie', cookie)
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
      .set('Cookie', cookie)
      .expect(400);
  });

  it('rejects invalid cursor', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/feed?cursor=garbage')
      .set('Cookie', cookie)
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
        .set('Cookie', cookie)
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
          '/posts/99999999-9999-4999-8999-999999999998',
        )
        .set('Cookie', cookie)
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
      .set('Cookie', cookie)
      .expect(400);
  });

  it('returns existing user', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get(
          '/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ).set('Cookie', cookie)
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
          '/users/99999999-9999-4999-8999-999999999998',
        ).set('Cookie', cookie)
        .expect(404);

    expect(
      response.body.error.code,
    ).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid user id', async () => {
    await request(
      app.getHttpServer(),
    )
      .get('/users/hello').set('Cookie', cookie)
      .expect(400);
  });

  it('returns request id header', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/health/live').set('Cookie', cookie)
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
        .set('Cookie', cookie)
        .expect(200);

    expect(
      response.headers[
        'x-request-id'
      ],
    ).toBe(requestId);
  }

);
it('rejects a handle shorter than the DTO minimum', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      handle: 'ab',
      displayName: 'Test User',
      password: 'Valid-password-123',
    })
    .expect(400);

  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.requestId).toEqual(expect.any(String));
});

it('rejects an unexpected registration field', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      handle: 'valid_handle',
      displayName: 'Test User',
      password: 'Valid-password-123',
      userId: 'some-user-id',
    })
    .expect(400);

  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.requestId).toEqual(expect.any(String));
});

it('rejects a registration password shorter than the DTO minimum', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      handle: 'valid_handle',
      displayName: 'Test User',
      password: 'short',
    })
    .expect(400);

  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

it('uses the authenticated account as the post author, not body authorId', async () => {
  const currentAccount = await request(app.getHttpServer())
    .get('/auth/me')
    .set('Cookie', cookie)
    .expect(200);

  const forgedAuthorId =
    '99999999-9999-4999-8999-999999999999';

  const response = await request(app.getHttpServer())
    .post('/posts')
    .set('Cookie', cookie)
    .send({
      authorId: forgedAuthorId,
      kind: 'original',
      text: 'Identity verification test',
    })
    .expect(201);

  expect(response.body.item.author.id).toBe(
    currentAccount.body.item.id,
  );
  expect(response.body.item.author.id).not.toBe(
    forgedAuthorId,
  );
});
});