import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { FollowStatus } from '../database/entities/follow.entity';

import {
  FollowRepository,
  FollowOperationResult,
} from './follow.repository';

import type { FeedCursor } from './repository.types';
import type {
  FollowListItem,
} from './follow.repository';

@Injectable()
export class TypeOrmFollowRepository
  implements FollowRepository
{
  constructor(
    private readonly database: DatabaseService,
  ) {}

  // Ensure the relationship exists.
  async requestFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowOperationResult> {
    const rows: { status: FollowStatus }[] =
      await this.database.query(
        `
        INSERT INTO follows (
          follower_id,
          following_id,
          status
        )
        SELECT
          $1,
          target.id,
          CASE
            WHEN target.is_private THEN 'pending'
            ELSE 'accepted'
          END
        FROM users target
        WHERE target.id = $2
          AND target.disabled_at IS NULL

        ON CONFLICT (follower_id, following_id)
        DO UPDATE SET
          status = CASE
            WHEN follows.status IN ('pending', 'rejected', 'cancelled')
              THEN EXCLUDED.status
            ELSE follows.status
          END

        RETURNING status
        `,
        [followerId, followingId],
      );

    if (rows.length === 0) {
      return { status: 'not-found' };
    }

    return { status: rows[0].status };
  }

  // Ensure the relationship is inactive.
  async cancelFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowOperationResult> {
    const rows: { status: FollowStatus }[] =
      await this.database.query(
        `
        UPDATE follows
        SET status = 'cancelled'
        WHERE follower_id = $1
          AND following_id = $2
          AND status IN ('pending', 'accepted')
        RETURNING status
        `,
        [followerId, followingId],
      );

    if (rows.length > 0) {
      return { status: rows[0].status };
    }

    const existing: { status: FollowStatus }[] =
      await this.database.query(
        `
        SELECT status
        FROM follows
        WHERE follower_id = $1
          AND following_id = $2
        `,
        [followerId, followingId],
      );

    if (existing.length > 0) {
      return { status: existing[0].status };
    }

    return { status: 'not-following' };
  }

  // Only the target account should call this operation.
  async approveRequest(
    requesterId: string,
    targetId: string,
  ): Promise<FollowOperationResult> {
    return this.updatePendingRequest(
      requesterId,
      targetId,
      FollowStatus.ACCEPTED,
    );
  }

  // Only the target account should call this operation.
  async rejectRequest(
    requesterId: string,
    targetId: string,
  ): Promise<FollowOperationResult> {
    return this.updatePendingRequest(
      requesterId,
      targetId,
      FollowStatus.REJECTED,
    );
  }

  private async updatePendingRequest(
    requesterId: string,
    targetId: string,
    newStatus: FollowStatus.ACCEPTED | FollowStatus.REJECTED,
  ): Promise<FollowOperationResult> {
    const rows: { status: FollowStatus }[] =
      await this.database.query(
        `
        UPDATE follows
        SET status = $3
        WHERE follower_id = $1
          AND following_id = $2
          AND status = 'pending'
        RETURNING status
        `,
        [requesterId, targetId, newStatus],
      );

    if (rows.length > 0) {
      return { status: rows[0].status };
    }

    const existing: { status: FollowStatus }[] =
      await this.database.query(
        `
        SELECT status
        FROM follows
        WHERE follower_id = $1
          AND following_id = $2
        `,
        [requesterId, targetId],
      );

    if (existing.length > 0) {
      return { status: 'invalid-transition' };
    }

    return { status: 'not-following' };
  }

  async getRelationship(
  followerId: string,
  followingId: string,
): Promise<FollowStatus | null> {
  const rows: { status: FollowStatus }[] =
    await this.database.query(
      `
      SELECT status
      FROM follows
      WHERE follower_id = $1
        AND following_id = $2
      `,
      [followerId, followingId],
    );

  return rows[0]?.status ?? null;
}

async listFollowers(
  userId: string,
  cursor: FeedCursor | null,
  limit: number,
): Promise<FollowListItem[]> {
  return this.listRelationships(
    'followers',
    userId,
    cursor,
    limit,
  );
}

async listFollowing(
  userId: string,
  cursor: FeedCursor | null,
  limit: number,
): Promise<FollowListItem[]> {
  return this.listRelationships(
    'following',
    userId,
    cursor,
    limit,
  );
}

private async listRelationships(
  type: 'followers' | 'following',
  userId: string,
  cursor: FeedCursor | null,
  limit: number,
): Promise<FollowListItem[]> {
  const userColumn =
    type === 'followers'
      ? 'f.follower_id'
      : 'f.following_id';

  const rows: {
    id: string;
    handle: string;
    display_name: string;
    avatar_small_url: string | null;
    created_at: Date;
  }[] = await this.database.query(
    `
    SELECT
      u.id,
      u.handle,
      u.display_name,
      u.avatar_small_url,
      f.created_at
    FROM follows f
    INNER JOIN users u
      ON u.id = ${userColumn}
    WHERE ${
      type === 'followers'
        ? 'f.following_id'
        : 'f.follower_id'
    } = $1
      AND f.status = 'accepted'
      AND u.disabled_at IS NULL
      AND (
        $2::timestamptz IS NULL
        OR (f.created_at, ${userColumn})
          < ($2::timestamptz, $3::uuid)
      )
    ORDER BY f.created_at DESC, ${userColumn} DESC
    LIMIT $4
    `,
    [
      userId,
      cursor?.createdAt ?? null,
      cursor?.id ?? null,
      limit + 1,
    ],
  );

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarSmallUrl: row.avatar_small_url,
    createdAt: row.created_at,
  }));
}

}