import { FollowStatus } from '../database/entities/follow.entity';
import type { FeedCursor } from './repository.types';

export type FollowOperationResult =
  | { status: FollowStatus }
  | { status: 'not-following' }
  | { status: 'not-found' }
  | { status: 'invalid-transition' };

  export interface FollowListUser {
  id: string;
  handle: string;
  displayName: string;
  avatarSmallUrl: string | null;
}
  
  export interface FollowListItem extends FollowListUser {
  createdAt: Date;
}

export type FollowListType = 'followers' | 'following';

export type FollowRelationshipStatus =
  | FollowStatus
  | null;

export interface FollowRepository {
  requestFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowOperationResult>;

  cancelFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowOperationResult>;

  approveRequest(
    requesterId: string,
    targetId: string,
  ): Promise<FollowOperationResult>;

  rejectRequest(
    requesterId: string,
    targetId: string,
  ): Promise<FollowOperationResult>;

  getRelationship(
    followerId: string,
    followingId: string,
  ): Promise<FollowRelationshipStatus>;

  listFollowers(
    userId: string,
    cursor: FeedCursor | null,
    limit: number,
  ): Promise<FollowListItem[]>;

  listFollowing(
    userId: string,
    cursor: FeedCursor | null,
    limit: number,
  ): Promise<FollowListItem[]>;
}