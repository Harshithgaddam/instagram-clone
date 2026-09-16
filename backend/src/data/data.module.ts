// src/data/data.module.ts

import { Module } from '@nestjs/common';

import { FixturePostRepository } from './fixture.repository';
import { FixtureUserRepository } from './fixture.user.repository';

import {
  POST_REPOSITORY,
  USER_REPOSITORY,
} from './data.tokens';

@Module({
  providers: [
    {
      provide: POST_REPOSITORY,
      useClass: FixturePostRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: FixtureUserRepository,
    },
  ],

  exports: [
    POST_REPOSITORY,
    USER_REPOSITORY,
  ],
})
export class DataModule {}