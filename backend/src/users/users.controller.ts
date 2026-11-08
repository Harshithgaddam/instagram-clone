// src/users/users.controller.ts

import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  UseGuards,
  Body,
  Post,
  Delete,
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update.profile.dto';
import{CurrentUser} from '../auth/current-user.decorator';
import type {AuthenticatedUser} from '../auth/current-user.decorator';
import { validateUuid } from '../common/validation';
import {AuthGuard} from '../auth/auth.guard';

import {
  rejectRepeatedQueryParameter,
  rejectUnknownQueryParameters,
  validateCursor,
  validateLimit,
} from '../common/validation';

import { decodeCursor } from '../common/cursor';


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUser(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');

    return this.usersService.getUser(id, actor.userId);
  }
  @Get(':id/media')
  async getUserMedia(
    @Param('id') id: string,
    @Query()
    query: Record<string, string | string[] | undefined>,
  ) {
    const safeQuery = query ?? {};

    rejectUnknownQueryParameters(
      safeQuery,
      ['cursor', 'limit'],
    );

    const singleCursor =
      rejectRepeatedQueryParameter(
        safeQuery.cursor,
        'cursor',
      );

    const singleLimit =
      rejectRepeatedQueryParameter(
        safeQuery.limit,
        'limit',
      );

    const limit = validateLimit(singleLimit);
    const cursor = validateCursor(singleCursor);

    let decodedCursor:
      | ReturnType<typeof decodeCursor>
      | null = null;

    if (cursor !== undefined) {
      try {
        decodedCursor = decodeCursor(cursor);
      } catch {
        throw new Error('Invalid cursor');
      }
    }

    return this.usersService.getUserMedia(
      id,
      decodedCursor
        ? {
            createdAt: new Date(
              decodedCursor.createdAt,
            ),
            id: decodedCursor.id,
          }

        : null,
      limit,
    );
  }

  @Get(':id/posts')
  @UseGuards(AuthGuard)
  async getUserPosts(
    @Param('id') id: string,
    @Query()
    query: Record<string, string | string[] | undefined>,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');
    const safeQuery = query ?? {};
    rejectUnknownQueryParameters(safeQuery, [
      'cursor',
      'limit',
      'kind',
    ]);

    const kind = rejectRepeatedQueryParameter(safeQuery.kind, 'kind');
    if (kind !== 'original' && kind !== 'repost') {
      throw new BadRequestException('kind must be original or repost');
    }

    const cursorValue = rejectRepeatedQueryParameter(
      safeQuery.cursor,
      'cursor',
    );
    const limit = validateLimit(
      rejectRepeatedQueryParameter(safeQuery.limit, 'limit'),
    );
    const validatedCursor = validateCursor(cursorValue);
    let cursor: ReturnType<typeof decodeCursor> | null = null;

    if (validatedCursor !== undefined) {
      try {
        cursor = decodeCursor(validatedCursor);
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }

    return this.usersService.getUserPosts(
      id,
      kind,
      cursor
        ? {
            createdAt: new Date(cursor.createdAt),
            id: cursor.id,
          }
        : null,
      limit,
      actor.userId,
    );
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMyProfile(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      actor.userId,
      dto,
    );
  }
  @Post('deactivate')
@UseGuards(AuthGuard)
async deactivateAccount(
  @CurrentUser() actor: AuthenticatedUser,
) {
  return this.usersService.deactivateAccount(
    actor.userId,
  );
}

@Post(':id/follow')
@UseGuards(AuthGuard)
async followUser(
  @Param('id') id: string,
  @CurrentUser() actor: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  return this.usersService.followUser(
    actor.userId,
    id,
  );
}

@Delete(':id/follow')
@UseGuards(AuthGuard)
async unfollowUser(
  @Param('id') id: string,
  @CurrentUser() actor: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  return this.usersService.unfollowUser(
    actor.userId,
    id,
  );
}

@Get(':id/followers')
async getFollowers(
  @Param('id') id: string,
  @Query()
  query: Record<string, string | string[] | undefined>,
  @CurrentUser() actor?: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  const safeQuery = query ?? {};

  rejectUnknownQueryParameters(safeQuery, [
    'cursor',
    'limit',
  ]);

  const singleCursor = rejectRepeatedQueryParameter(
    safeQuery.cursor,
    'cursor',
  );

  const singleLimit = rejectRepeatedQueryParameter(
    safeQuery.limit,
    'limit',
  );

  const limit = validateLimit(singleLimit);
  const cursor = validateCursor(singleCursor);

  let decodedCursor: ReturnType<typeof decodeCursor> | null = null;

  if (cursor !== undefined) {
    try {
      decodedCursor = decodeCursor(cursor);
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  return this.usersService.getFollowers(
    id,
    actor?.userId ?? null,
    decodedCursor
      ? {
          createdAt: new Date(decodedCursor.createdAt),
          id: decodedCursor.id,
        }
      : null,
    limit,
  );
}

@Get(':id/following')
async getFollowing(
  @Param('id') id: string,
  @Query()
  query: Record<string, string | string[] | undefined>,
  @CurrentUser() actor?: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  const safeQuery = query ?? {};

  rejectUnknownQueryParameters(safeQuery, [
    'cursor',
    'limit',
  ]);

  const singleCursor = rejectRepeatedQueryParameter(
    safeQuery.cursor,
    'cursor',
  );

  const singleLimit = rejectRepeatedQueryParameter(
    safeQuery.limit,
    'limit',
  );

  const limit = validateLimit(singleLimit);
  const cursor = validateCursor(singleCursor);

  let decodedCursor: ReturnType<typeof decodeCursor> | null = null;

  if (cursor !== undefined) {
    try {
      decodedCursor = decodeCursor(cursor);
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  return this.usersService.getFollowing(
    id,
    actor?.userId ?? null,
    decodedCursor
      ? {
          createdAt: new Date(decodedCursor.createdAt),
          id: decodedCursor.id,
        }
      : null,
    limit,
  );
}

@Post('me/follow-requests/:requesterId/approve')
@UseGuards(AuthGuard)
async approveFollowRequest(
  @Param('requesterId') requesterId: string,
  @CurrentUser() actor: AuthenticatedUser,
) {
  validateUuid(requesterId, 'requesterId');

  return this.usersService.approveFollowRequest(
    actor.userId,
    requesterId,
  );
}

@Post('me/follow-requests/:requesterId/reject')
@UseGuards(AuthGuard)
async rejectFollowRequest(
  @Param('requesterId') requesterId: string,
  @CurrentUser() actor: AuthenticatedUser,
) {
  validateUuid(requesterId, 'requesterId');

  return this.usersService.rejectFollowRequest(
    actor.userId,
    requesterId,
  );
}
}
