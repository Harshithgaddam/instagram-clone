
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard';
import {
  CurrentUser,
} from './current-user.decorator';
import type {
  AuthenticatedUser,
} from './current-user.decorator';
import  { RegisterDto } from './dto/register.dto';
import  { LoginDto } from './dto/login.dto';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';

  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    response.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${session.token}; ${cookieOptions()}`,
    );

    return {
      item: session.account,
      expiresAt: session.expiresAt,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async currentAccount(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.currentAccount(user.userId);
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request.authToken) {
      throw new UnauthorizedException('Authentication required');
    }

    const expiresAt = await this.authService.renewSession(
      user.sessionId,
    );

    response.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${request.authToken}; ${cookieOptions()}`,
    );

    return { expiresAt };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.sessionId);

    const secure =
      process.env.NODE_ENV === 'production';

    response.setHeader(
      'Set-Cookie',
      [
        `${COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0',
        ...(secure ? ['Secure'] : []),
      ].join('; '),
    );
  }
}
