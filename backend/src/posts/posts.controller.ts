// src/posts/posts.controller.ts

import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { PostsService } from './posts.service';

import { validateUuid } from '../common/validation';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
  ) {}

  @Get(':id')
  async getPost(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.postsService.getPost(id);
  }
}