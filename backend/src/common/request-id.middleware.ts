// src/common/request-id.middleware.ts

import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware
  implements NestMiddleware
{
  use(
    req: any,
    res: any,
    next: () => void,
  ) {
    const incomingRequestId =
      req.headers['x-request-id'];

    const requestId =
      typeof incomingRequestId === 'string' &&
      incomingRequestId.length > 0
        ? incomingRequestId
        : randomUUID();

    req.requestId = requestId;

    res.setHeader(
      'X-Request-Id',
      requestId,
    );

    next();
  }
}