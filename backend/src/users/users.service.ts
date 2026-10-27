// src/users/users.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { USER_REPOSITORY,POST_REPOSITORY,AUTH_REPOSITORY } from '../data/data.tokens';

import type { UserRepository ,ProfileUpdateChanges, UpdatedProfile} from '../data/user.repository';
import type { PostRepository } from '../data/post.repository';
import type {AuthRepository} from '../auth/auth.repository';
import type { FeedCursor } from '../data/repository.types';
import type {UpdateProfileDto} from './dto/update.profile.dto';
import {
  UserDetailResponseDto,
} from './user-response.dto';

export type UpdatedProfileResult =
  | { status: 'updated'; user: UpdatedProfile }
  | { status: 'conflict' }
  | { status: 'not-found' };

@Injectable()
export class UsersService {
  constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepository: UserRepository,

  @Inject(POST_REPOSITORY)
  private readonly postRepository: PostRepository,
  @Inject(AUTH_REPOSITORY)
  private readonly authRepository: AuthRepository,
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
       avatarSmallUrl: user.avatarSmallUrl,
        avatarLargeUrl: user.avatarLargeUrl,
        postCount,
        followerCount,
        followingCount,
      },
    };
  }

  async getUserMedia(
  userId: string,
  cursor: FeedCursor | null,
  limit: number,
) {
  return this.postRepository.listProfileMedia(
    userId,
    cursor,
    limit,
  );
}
async updateProfile(
  actorId: string,
  dto: UpdateProfileDto,
) {
  const changes: ProfileUpdateChanges = {};

  if (dto.displayName !== undefined) {
    changes.displayName = dto.displayName;
  }

  if (dto.bio !== undefined) {
    // An empty bio means the user wants to clear it.
    changes.bio = dto.bio === '' ? null : dto.bio;
  }

  if (Object.keys(changes).length === 0) {
    throw new BadRequestException(
      'Provide at least one profile field to update',
    );
  }

  const result =
    await this.userRepository.updateProfile(
      actorId,
      changes,
      dto.version,
    );

  if (result.status === 'not-found') {
    throw new NotFoundException('User not found');
  }

  if (result.status === 'conflict') {
    throw new ConflictException(
      'Profile has changed. Fetch the latest profile and try again.',
    );
  }
   const user = result.user;

  // Return an approved projection, not the database entity.
  return {
    item: {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio,
      avatarSmallUrl: user.avatarSmallUrl,
      avatarLargeUrl: user.avatarLargeUrl, 
      version: user.version,
    },
  };
}

async deactivateAccount(actorId: string) {
  const deactivated =
    await this.authRepository.deactivateAccount(actorId);

  if (!deactivated) {
    throw new NotFoundException(
      'Active account not found',
    );
  }

  return {
    message: 'Account deactivated successfully',
  };
}
}