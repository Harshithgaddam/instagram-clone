import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { POST_REPOSITORY } from '../data/data.tokens';
import type { PostRepository } from '../data/post.repository';

import {
  FeedCursor,
  FeedPageResult,
  RepositoryError,
} from '../data/repository.types';

export interface SearchOptions {
  query: string;
  cursor: FeedCursor | null;
  limit: number;
}

@Injectable()
export class SearchService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepository,

    private readonly configService: ConfigService,
  ) {}

  async search({
    query,
    cursor,
    limit,
  }: SearchOptions): Promise<FeedPageResult> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      throw new BadRequestException({
        message: 'Search query is required.',
        details: [
          {
            field: 'q',
            reason: 'must not be empty',
          },
        ],
      });
    }

    if (trimmedQuery.length > 100) {
      throw new BadRequestException({
        message: 'Search query is too long.',
        details: [
          {
            field: 'q',
            reason: 'maximum length is 100 characters',
          },
        ],
      });
    }

    const viewerId =
      this.configService.getOrThrow<string>('demoUserId');

    try {
      return await this.postRepository.searchOriginals(
        trimmedQuery,
        cursor,
        limit,
        viewerId,
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw error;
    }
  }
}