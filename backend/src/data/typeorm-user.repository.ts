import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { DatabaseService } from '../database/database.service';
import {
  Post,
  PostKind,
} from '../database/entities/post.entity';
import { User as UserEntity } from '../database/entities/user.entity';

import {
  ProfileResult,
  RepositoryError,
} from './repository.types';

import type {
  User,
  UserRepository,
} from './user.repository';

@Injectable()
export class TypeOrmUserRepository
  implements UserRepository
{
  private readonly users: Repository<UserEntity>;
  private readonly posts: Repository<Post>;

  constructor(
    private readonly database: DatabaseService,
  ) {
    this.users =
      this.database.getRepository(UserEntity);

    this.posts =
      this.database.getRepository(Post);
  }

  // =========================================================
  // EXISTING METHOD: FIND USER BY ID
  // =========================================================

  async findById(
    id: string,
  ): Promise<User | null> {
    try {
      const user =
        await this.users.findOne({
          where: { id },
        });

      if (!user) {
        return null;
      }

      // Convert database entity -> repository contract
      return {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio,
      avatarSmallUrl: user.avatarSmallUrl,
      avatarLargeUrl: user.avatarLargeUrl,
    };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD: COUNT ORIGINAL POSTS
  // =========================================================

  async countOriginalPosts(
    userId: string,
  ): Promise<number> {
    try {
      return await this.posts.count({
        where: {
          authorId: userId,
          kind: PostKind.ORIGINAL,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD: COUNT FOLLOWERS
  // =========================================================

  async countFollowers(
    userId: string,
  ): Promise<number> {
    try {
      const result =
        await this.users.query(
          `
          SELECT COUNT(*)::text AS count
          FROM follows
          WHERE following_id = $1
          `,
          [userId],
        );

      return Number(
        result[0]?.count ?? 0,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // EXISTING METHOD: COUNT FOLLOWING
  // =========================================================

  async countFollowing(
    userId: string,
  ): Promise<number> {
    try {
      const result =
        await this.users.query(
          `
          SELECT COUNT(*)::text AS count
          FROM follows
          WHERE follower_id = $1
          `,
          [userId],
        );

      return Number(
        result[0]?.count ?? 0,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // C2 METHOD: GET PROFILE
  // =========================================================

  async getProfile(
    userId: string,
  ): Promise<ProfileResult | null> {
    try {
      const user =
        await this.users.findOne({
          where: {
            id: userId,
          },
        });

      if (!user) {
        return null;
      }

      const [
        originalCount,
        followerCount,
        followingCount,
      ] = await Promise.all([
        this.countOriginalPosts(
          userId,
        ),
        this.countFollowers(
          userId,
        ),
        this.countFollowing(
          userId,
        ),
      ]);

      return {
        id: user.id,
        handle: user.handle,
        displayName:
          user.displayName,
        bio: user.bio,
        avatarSmallUrl:
          user.avatarSmallUrl,
        avatarLargeUrl:
          user.avatarLargeUrl,
        originalCount,
        followerCount,
        followingCount,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // =========================================================
  // DATABASE ERROR HANDLING
  // =========================================================

  private handleDatabaseError(
    error: unknown,
  ): never {
    if (
      error instanceof RepositoryError
    ) {
      throw error;
    }

    console.error(
      'User repository database operation failed',
      error,
    );

    throw new RepositoryError(
      'INTERNAL',
      'Internal database error',
    );
  }
}