// src/posts/posts.module.ts

import { Module } from '@nestjs/common';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

import { DataModule } from '../data/data.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [DataModule,AuthModule],

  controllers: [
    PostsController,
  ],

  providers: [
    PostsService,
  ],
})
export class PostsModule {}