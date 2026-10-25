
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export interface AuthenticatedUser {
  sessionId: string;
  userId: string;
  handle: string;
  displayName: string;
}

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<{ authUser?: AuthenticatedUser }>();

    return request.authUser;
  },
);
