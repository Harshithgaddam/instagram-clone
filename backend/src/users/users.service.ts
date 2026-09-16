// src/users/users.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { USER_REPOSITORY } from '../data/data.tokens';

import type { UserRepository } from '../data/user.repository';

import {
  UserDetailResponseDto,
} from './user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async getUser(
    id: string,
  ): Promise<UserDetailResponseDto> {
    const user =
      await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const [
      postCount,
      followerCount,
      followingCount,
    ] = await Promise.all([
      this.userRepository.countOriginalPosts(id),
      this.userRepository.countFollowers(id),
      this.userRepository.countFollowing(id),
    ]);

    return {
      item: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        postCount,
        followerCount,
        followingCount,
      },
    };
  }
}