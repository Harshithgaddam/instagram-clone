import { PostsController } from './posts.controller';
import { jest } from '@jest/globals';
describe('PostsController', () => {
  let controller: PostsController;

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
      await controller.getPost(id);

    expect(postsService.getPost).toHaveBeenCalledWith(
      id,
    );

    expect(result).toEqual(expected);
  });

  it('should reject an invalid UUID', async () => {
    await expect(
      controller.getPost('hello'),
    ).rejects.toThrow();

    expect(
      postsService.getPost,
    ).not.toHaveBeenCalled();
  });
});