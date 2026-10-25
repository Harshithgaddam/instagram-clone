
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { TypeOrmAuthRepository } from './typeorm-auth.repository';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
  AuthService,
  TypeOrmAuthRepository,
  AuthGuard,
],
  exports: [AuthService],
})
export class AuthModule {}
