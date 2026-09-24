import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import configuration from './config/configuration';

import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { DataModule } from './data/data.module';
import { DatabaseModule } from './database/database.module';
import {SearchModule} from './search/search.module';
import {
  RequestIdMiddleware,
} from './common/request-id.middleware';

import {
  RequestLoggingMiddleware,
} from './common/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    DataModule,
    SearchModule,
  ],
})
export class AppModule
  implements NestModule
{
  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(
        RequestIdMiddleware,
        RequestLoggingMiddleware,
      )
      .forRoutes('*');
  }
}