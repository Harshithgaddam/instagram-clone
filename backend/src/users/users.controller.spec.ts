import { UsersController } from './users.controller';
import { jest } from '@jest/globals';
describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    getUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new UsersController(
      usersService as any,
    );
  });

  it('should call the service with a valid UUID', async () => {
    const id =
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    const expected = {
      item: {
        id,
        handle: 'asha',
        displayName: 'Asha',
        bio: 'Hello',
        avatar: {
          smallUrl: '/fixtures/asha-48.jpg',
          largeUrl: '/fixtures/asha-96.jpg',
        },
        postCount: 5,
        followerCount: 3,
        followingCount: 2,
      },
    };

    usersService.getUser.mockResolvedValue(
      expected,
    );

    const result =
      await controller.getUser(id);

    expect(usersService.getUser).toHaveBeenCalledWith(
      id,
    );

    expect(result).toEqual(expected);
  });

  it('should reject an invalid UUID', async () => {
    await expect(
      controller.getUser('hello'),
    ).rejects.toThrow();

    expect(
      usersService.getUser,
    ).not.toHaveBeenCalled();
  });
});