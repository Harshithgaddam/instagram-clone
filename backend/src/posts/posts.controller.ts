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

@Controller('posts')
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
  ) {
    validateUuid(id, 'id');

    return this.postsService.getPost(
      id,
    );
  }

  // ============================================================
  // POST /posts
  // ============================================================

  @Get(':id/replies')
  async getReplies(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.postsService.getReplies(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() body: unknown,
  ) {
    return this.postsService.createPost(
      body,
    );
  }

  // ============================================================
  // PUT /posts/:id/like
  // ============================================================

  @Put(':id/like')
  @HttpCode(HttpStatus.OK)
  async likePost(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.postsService.likePost(
      id,
    );
  }

  // ============================================================
  // DELETE /posts/:id/like
  // ============================================================

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async unlikePost(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.postsService.unlikePost(
      id,
    );
  }
}