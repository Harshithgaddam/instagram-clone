import { Injectable } from '@nestjs/common';

import {
  User,
  UserRepository,
} from './user.repository';

import {
  users,
  posts,
  follows,
} from './fixtures';

@Injectable()
export class FixtureUserRepository
  implements UserRepository
{
  async findById(
    id: string,
  ): Promise<User | null> {
    const user = users.find(
      (item) => item.id === id,
    );

    if (!user) {
      return null;
    }

    return {
      ...user,
      avatar: {
        ...user.avatar,
      },
    };
  }

  async countOriginalPosts(
    userId: string,
  ): Promise<number> {
    return posts.filter(
      (post) =>
        post.authorId === userId &&
        post.kind === 'original',
    ).length;
  }

  async countFollowers(
    userId: string,
  ): Promise<number> {
    return follows.filter(
      (follow) =>
        follow.followingId === userId,
    ).length;
  }

  async countFollowing(
    userId: string,
  ): Promise<number> {
    return follows.filter(
      (follow) =>
        follow.followerId === userId,
    ).length;
  }
}