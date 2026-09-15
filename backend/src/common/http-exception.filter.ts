import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ) {
    const ctx =
      host.switchToHttp();

    const request =
      ctx.getRequest();

    const response =
      ctx.getResponse();

    const requestId =
      request.requestId ??
      'unknown';

    let status =
      HttpStatus.INTERNAL_SERVER_ERROR;

    let code =
      'INTERNAL_ERROR';

    let message =
      'Internal server error';

    let details: unknown[] = [];

    if (
      exception instanceof
      HttpException
    ) {
      status =
        exception.getStatus();

      const exceptionResponse =
        exception.getResponse();

      if (
        typeof exceptionResponse ===
        'string'
      ) {
        message =
          exceptionResponse;
      } else if (
        typeof exceptionResponse ===
          'object' &&
        exceptionResponse !== null
      ) {
        const body =
          exceptionResponse as Record<
            string,
            unknown
          >;

        if (
          typeof body.message ===
          'string'
        ) {
          message =
            body.message;
        }

        if (
          Array.isArray(
            body.details,
          )
        ) {
          details =
            body.details;
        }

        if (
          Array.isArray(
            body.message,
          )
        ) {
          details =
            body.message;

          message =
            'Request validation failed';
        }
      }

      code =
        this.getErrorCode(
          status,
        );
    }

    response
      .status(status)
      .json({
        error: {
          code,
          message,
          details,
        },
        requestId,
      });
  }

  private getErrorCode(
    status: number,
  ): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';

      default:
        return 'INTERNAL_ERROR';
    }
  }
}