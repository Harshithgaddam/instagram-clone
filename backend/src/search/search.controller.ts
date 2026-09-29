import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchService } from './search.service';
import { validateCursor } from '../common/validation';
import { decodeCursor } from '../common/cursor';
import type { FeedCursor } from '../data/repository.types';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query?.trim()) {
      throw new BadRequestException(
        'q is required',
      );
    }

    const validatedCursor = validateCursor(cursor);

    let decodedCursor: FeedCursor | null = null;

    if (validatedCursor !== undefined) {
      try {
        const decoded = decodeCursor(validatedCursor);

        decodedCursor = {
          createdAt: new Date(decoded.createdAt),
          id: decoded.id,
        };
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

    const parsedLimit = limit
      ? Number(limit)
      : 10;

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 50
    ) {
      throw new BadRequestException({
        message: 'Invalid limit',
        details: [
          {
            field: 'limit',
            reason: 'must be an integer between 1 and 50',
          },
        ],
      });
    }

    return this.searchService.search({
      query: query.trim(),
      cursor: decodedCursor,
      limit: parsedLimit,
    });
  }
}