// src/data/data.module.ts

import { Module } from '@nestjs/common';

import { POST_REPOSITORY ,USER_REPOSITORY ,AUTH_REPOSITORY} from './data.tokens';

import { TypeOrmPostRepository } from './typeorm-post.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import {TypeOrmAuthRepository} from '../auth/typeorm-auth.repository';

@Module({
  providers: [
    TypeOrmPostRepository,
    TypeOrmUserRepository,
    TypeOrmAuthRepository,

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
  ],

  exports: [
    POST_REPOSITORY,
    USER_REPOSITORY,
    AUTH_REPOSITORY,
  ],
})
export class DataModule {}