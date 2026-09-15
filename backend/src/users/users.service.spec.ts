import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const userRepository = {
    findById: jest.fn(),
    countOriginalPosts: jest.fn(),
    countFollowers: jest.fn(),
    countFollowing: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UsersService(
      userRepository as any,
    );
  });

  it('should return a user with counts', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      handle: 'asha',
      displayName: 'Asha',
      bio: 'Hello',
      avatar: {
        smallUrl: '/fixtures/asha-48.jpg',
        largeUrl: '/fixtures/asha-96.jpg',
      },
    });

    userRepository.countOriginalPosts.mockResolvedValue(5);
    userRepository.countFollowers.mockResolvedValue(3);
    userRepository.countFollowing.mockResolvedValue(2);

    const result = await service.getUser(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );

    expect(result).toEqual({
      item: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      service.getUser(
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});