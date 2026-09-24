export class FeedAuthorDto {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarSmallUrl: string | null;
  avatarLargeUrl: string | null;
}

export class FeedMediaDto {
  id: string;
  altText: string;
  smallUrl: string;
  largeUrl: string;
}

export class FeedPostResponseDto {
  id: string;
  kind: 'original' | 'reply' | 'repost';
  text: string | null;
  createdAt: string;

  author: FeedAuthorDto;
  media: FeedMediaDto[];

  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;

  replyToId: string | null;
  repostOfId: string | null;
}

export class FeedResponseDto {
  items: FeedPostResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}