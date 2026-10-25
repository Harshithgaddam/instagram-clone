
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './current-user.decorator';

export interface AuthenticatedRequest {
  headers: {
    cookie?: string;
  };
  authUser?: AuthenticatedUser;
  authToken?: string;
}

function getCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');

    if (separator < 0) continue;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === name) return value;
  }

  return undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = getCookie(
      request.headers.cookie,
      'session',
    );

    if (!token) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const user = await this.authService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired session',
      );
    }

    request.authUser = user;
    request.authToken = token;
    return true;
  }
}
