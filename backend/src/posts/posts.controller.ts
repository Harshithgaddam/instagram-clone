// src/posts/posts.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { PostsService } from './posts.service';

import {
  validateUuid,
} from '../common/validation';

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
  ) {}

  // ============================================================
  // GET /posts/:id
  // ============================================================

  @Get(':id')
  async getPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');

    return this.postsService.getPost(
      id,user.userId,
    );
  }

  // ============================================================
  // POST /posts
  // ============================================================

  @Get(':id/replies')
  async getReplies(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');

    return this.postsService.getReplies(id,user.userId,);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.createPost(
      body,
      user.userId,
    );
  }

  // ============================================================
  // PUT /posts/:id/like
  // ============================================================

  @Put(':id/like')
  @HttpCode(HttpStatus.OK)
  async likePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');

    return this.postsService.likePost(
      id,user.userId,
    );
  }

  // ============================================================
  // DELETE /posts/:id/like
  // ============================================================

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async unlikePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    validateUuid(id, 'id');

    return this.postsService.unlikePost(
      id,user.userId,
    );
  }
  // ============================================================
// DELETE /posts/:id
// ============================================================

@Delete(':id')
@HttpCode(HttpStatus.OK)
async deletePost(
  @Param('id') id: string,
  @CurrentUser() user: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  return this.postsService.deletePost(id,user.userId);
}

@Delete(':id/repost')
@HttpCode(HttpStatus.OK)
async undoRepost(
  @Param('id') id: string,
  @CurrentUser() user: AuthenticatedUser,
) {
  validateUuid(id, 'id');

  return this.postsService.undoRepost(id, user.userId);
}
}