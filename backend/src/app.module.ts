import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { rateLimit } from 'express-rate-limit';
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

import { AuthModule } from './auth/auth.module';
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Try again later.',
      details: [],
    },
  },
});

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many registration attempts. Try again later.',
      details: [],
    },
  },
});
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
    AuthModule,
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
      consumer
  .apply(loginRateLimit)
  .forRoutes({
    path: 'auth/login',
    method: RequestMethod.POST,
  });

consumer
  .apply(registerRateLimit)
  .forRoutes({
    path: 'auth/register',
    method: RequestMethod.POST,
  });
  }
}