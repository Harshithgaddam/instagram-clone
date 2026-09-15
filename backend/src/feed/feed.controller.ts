import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { FeedService } from './feed.service';

import {
  decodeCursor,
} from '../common/cursor';

import {
  rejectLegacyPagination,
  rejectRepeatedQueryParameter,
  rejectUnknownQueryParameters,
  validateCursor,
  validateLimit,
} from '../common/validation';

@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
  ) {}

  @Get()
async getFeed(
  @Query()
  query: Record<
    string,
    string | string[] | undefined
  >,
) {
  const safeQuery = query ?? {};

  rejectUnknownQueryParameters(
    safeQuery,
    [
      'cursor',
      'limit',
      'page',
      'offset',
    ],
  );

  const singleCursor =
    rejectRepeatedQueryParameter(
      safeQuery.cursor,
      'cursor',
    );

  const singleLimit =
    rejectRepeatedQueryParameter(
      safeQuery.limit,
      'limit',
    );

  const singlePage =
    rejectRepeatedQueryParameter(
      safeQuery.page,
      'page',
    );

  const singleOffset =
    rejectRepeatedQueryParameter(
      safeQuery.offset,
      'offset',
    );


    rejectLegacyPagination(
      singlePage,
      singleOffset,
    );

    const parsedLimit =
      validateLimit(singleLimit);

    const validatedCursor =
      validateCursor(singleCursor);

    let decodedCursor:
      | ReturnType<typeof decodeCursor>
      | undefined;

    if (
      validatedCursor !== undefined
    ) {
      try {
        decodedCursor =
          decodeCursor(
            validatedCursor,
          );
      } catch {
        throw new BadRequestException({
          message: 'Invalid cursor',
          details: [
            {
              field: 'cursor',
              reason: 'invalid',
            },
          ],
        });
      }
    }

    return this.feedService.getPosts({
      kind: 'original',
      limit: parsedLimit,
      cursorCreatedAt:
        decodedCursor?.createdAt,
      cursorId:
        decodedCursor?.id,
    });
  }
}