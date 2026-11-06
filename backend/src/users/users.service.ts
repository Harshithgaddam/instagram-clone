// src/users/users.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { encodeCursor } from '../common/cursor';
import { USER_REPOSITORY,POST_REPOSITORY,AUTH_REPOSITORY ,FOLLOW_REPOSITORY} from '../data/data.tokens';

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

import type { FollowRepository } from '../data/follow.repository';

@Injectable()
export class UsersService {
  constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepository: UserRepository,

  @Inject(POST_REPOSITORY)
  private readonly postRepository: PostRepository,
  @Inject(AUTH_REPOSITORY)
  private readonly authRepository: AuthRepository,

  @Inject(FOLLOW_REPOSITORY)
private readonly followRepository: FollowRepository,
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

async followUser(
  actorId: string,
  targetId: string,
) {
  if (actorId === targetId) {
    throw new BadRequestException(
      'You cannot follow yourself',
    );
  }

  const result = await this.followRepository.requestFollow(
    actorId,
    targetId,
  );

  if (result.status === 'not-found') {
    throw new NotFoundException('User not found');
  }

  return {
    item: {
      followingId: targetId,
      status: result.status,
      isFollowing: result.status === 'accepted',
    },
  };
}
async unfollowUser(
  actorId: string,
  targetId: string,
) {
  if (actorId === targetId) {
    throw new BadRequestException(
      'You cannot unfollow yourself',
    );
  }

  const result = await this.followRepository.cancelFollow(
    actorId,
    targetId,
  );

  return {
    item: {
      followingId: targetId,
      status: result.status,
      isFollowing: false,
    },
  };
}

async approveFollowRequest(
  actorId: string,
  requesterId: string,
) {
  const result = await this.followRepository.approveRequest(
    requesterId,
    actorId,
  );

  if (result.status === 'not-following') {
    throw new NotFoundException(
      'Follow request not found',
    );
  }

  if (result.status === 'invalid-transition') {
    throw new ConflictException(
      'This follow request cannot be approved',
    );
  }

  return {
    item: {
      requesterId,
      status: result.status,
    },
  };
}

async rejectFollowRequest(
  actorId: string,
  requesterId: string,
) {
  const result = await this.followRepository.rejectRequest(
    requesterId,
    actorId,
  );

  if (result.status === 'not-following') {
    throw new NotFoundException(
      'Follow request not found',
    );
  }

  if (result.status === 'invalid-transition') {
    throw new ConflictException(
      'This follow request cannot be rejected',
    );
  }

  return {
    item: {
      requesterId,
      status: result.status,
    },
  };
}


private async checkRelationshipListAccess(
  targetId: string,
  viewerId: string | null,
): Promise<void> {
  const target = await this.userRepository.findById(targetId);

  if (!target) {
    throw new NotFoundException('User not found');
  }

  // Everyone can see public account relationship lists.
  if (!target.isPrivate) {
    return;
  }

  // Account owner can always see their own lists.
  if (viewerId === targetId) {
    return;
  }

  // Anonymous users cannot view private account lists.
  if (!viewerId) {
    throw new ForbiddenException(
      'You cannot view this account relationship list',
    );
  }

  const relationship =
    await this.followRepository.getRelationship(
      viewerId,
      targetId,
    );

  if (relationship !== 'accepted') {
    throw new ForbiddenException(
      'You cannot view this account relationship list',
    );
  }
}

async getFollowers(
  targetId: string,
  viewerId: string | null,
  cursor: FeedCursor | null,
  limit: number,
) {
  await this.checkRelationshipListAccess(
    targetId,
    viewerId,
  );

  const rows = await this.followRepository.listFollowers(
    targetId,
    cursor,
    limit,
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  const nextCursor =
    hasMore && last
      ? encodeCursor(last.createdAt.toISOString(), last.id)
      : null;

  return {
    items: page.map(({ createdAt, ...user }) => user),
    nextCursor,
  };
}

async getFollowing(
  targetId: string,
  viewerId: string | null,
  cursor: FeedCursor | null,
  limit: number,
) {
  await this.checkRelationshipListAccess(
    targetId,
    viewerId,
  );

  const rows = await this.followRepository.listFollowing(
    targetId,
    cursor,
    limit,
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  const nextCursor =
    hasMore && last
      ? encodeCursor(last.createdAt.toISOString(), last.id)
      : null;

  return {
    items: page.map(({ createdAt, ...user }) => user),
    nextCursor,
  };
}

}