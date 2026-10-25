import { PostsController } from './posts.controller';
import { jest } from '@jest/globals';
describe('PostsController', () => {
  let controller: PostsController;
  const user = {
    userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    sessionId: 'session-id',
    handle: 'test_user',
    displayName: 'Test User',
  };

  const postsService = {
    getPost: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new PostsController(
      postsService as any,
    );
  });

  it('should call the service with a valid UUID', async () => {
    const id =
      '11111111-1111-4111-8111-111111111111';

    const expected = {
      item: {
        id,
      },
    };

    postsService.getPost.mockResolvedValue(
      expected,
    );

    const result =
      await controller.getPost(id, user);

    expect(postsService.getPost).toHaveBeenCalledWith(
      id,
      user.userId,
    );

    expect(result).toEqual(expected);
  });

  it('should reject an invalid UUID', async () => {
    await expect(
      controller.getPost('hello', user),
    ).rejects.toThrow();

    expect(
      postsService.getPost,
    ).not.toHaveBeenCalled();
  });
});