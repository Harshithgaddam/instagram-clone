// src/data/data.module.ts

import { Module } from '@nestjs/common';

import { POST_REPOSITORY } from './data.tokens';
import { USER_REPOSITORY } from './data.tokens';

import { TypeOrmPostRepository } from './typeorm-post.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';

@Module({
  providers: [
    TypeOrmPostRepository,
    TypeOrmUserRepository,

    {
      provide: POST_REPOSITORY,
      useExisting: TypeOrmPostRepository,
    },

    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
  ],

  exports: [
    POST_REPOSITORY,
    USER_REPOSITORY,
  ],
})
export class DataModule {}