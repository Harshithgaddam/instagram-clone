// src/data/data.module.ts

import { Module } from '@nestjs/common';

import { POST_REPOSITORY ,USER_REPOSITORY ,AUTH_REPOSITORY,FOLLOW_REPOSITORY} from './data.tokens';

import { TypeOrmPostRepository } from './typeorm-post.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import {TypeOrmAuthRepository} from '../auth/typeorm-auth.repository';
import { TypeOrmFollowRepository } from './typeorm-follow.repository';

@Module({
  providers: [
    TypeOrmPostRepository,
    TypeOrmUserRepository,
    TypeOrmAuthRepository,
    TypeOrmFollowRepository,

    {
      provide: POST_REPOSITORY,
      useExisting: TypeOrmPostRepository,
    },

    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },

    {
      provide: AUTH_REPOSITORY,
      useExisting: TypeOrmAuthRepository,
    },

    {
      provide: FOLLOW_REPOSITORY,
      useExisting: TypeOrmFollowRepository,
    },

  ],

  exports: [
    POST_REPOSITORY,
    USER_REPOSITORY,
    AUTH_REPOSITORY,
    FOLLOW_REPOSITORY,
  ],
})
export class DataModule {}