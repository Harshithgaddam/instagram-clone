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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const directory = join(process.cwd(), 'uploads', 'posts');
          mkdirSync(directory, { recursive: true });
          callback(null, directory);
        },
        filename: (_request, file, callback) => {
          const extension = file.originalname
            .split('.')
            .pop()
            ?.toLowerCase() || 'jpg';
          callback(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
          );
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
    }),
  )
  async createPost(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.createPost(
      body,
      user.userId,
      file,
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