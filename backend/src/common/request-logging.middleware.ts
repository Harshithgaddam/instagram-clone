import {
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';

@Injectable()
export class RequestLoggingMiddleware
  implements NestMiddleware
{
  private readonly logger =
    new Logger(
      RequestLoggingMiddleware.name,
    );

  use(
    req: any,
    res: any,
    next: () => void,
  ) {
    const startedAt =
      Date.now();

    res.on(
      'finish',
      () => {
        const durationMs =
          Date.now() -
          startedAt;

        this.logger.log(
          JSON.stringify({
            requestId:
              req.requestId ??
              'unknown',

            method: req.method,

            path:
              req.originalUrl ??
              req.url,

            status:
              res.statusCode,

            durationMs,
          }),
        );
      },
    );

    next();
  }
}