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
  async getUser(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.usersService.getUser(id);
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
}
