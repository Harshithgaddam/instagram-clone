import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { Like } from './entities/like.entity';
import { Follow } from './entities/follow.entity';

@Injectable()
export class DatabaseService
  extends DataSource
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    configService: ConfigService,
  ) {
    super({
      type: 'postgres',

      url: configService.getOrThrow<string>(
        'databaseUrl',
      ),

      connectTimeoutMS:
        configService.getOrThrow<number>(
          'databaseConnectTimeoutMs',
        ),

      synchronize: false,

      logging: false,

      entities: [
        User,
        Post,
        PostMedia,
        Like,
        Follow,
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();

      console.log(
        'PostgreSQL database connected successfully',
      );
    } catch (error) {
      console.error(
        'PostgreSQL database connection failed',
      );

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isInitialized) {
      await this.destroy();

      console.log(
        'PostgreSQL database connection closed',
      );
    }
  }
}