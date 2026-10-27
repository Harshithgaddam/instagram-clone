// src/users/users.module.ts

import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {AuthModule} from '../auth/auth.module';
import { DataModule } from '../data/data.module';

@Module({
  imports: [AuthModule,DataModule],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
  ],
})
export class UsersModule {}