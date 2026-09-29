export type PostKind =
  | 'original'
  | 'reply'
  | 'repost';

export interface FeedCursor {
  createdAt: Date;
  id: string;
}

export interface AuthorResult {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarSmallUrl: string | null;
  avatarLargeUrl: string | null;
}

export interface MediaResult {
  id: string;
  postId: string;
  images: MediaImage[];
}

export interface FeedPostResult {
  id: string;
  authorId: string;
  kind: PostKind;
  text: string | null;
  replyToId: string | null;
  repostOfId: string | null;
  createdAt: Date;

  author: AuthorResult;

  media: MediaResult | null;

  likeCount: number;
  replyCount: number;
  repostCount: number;

  likedByViewer: boolean;
}

export interface FeedPageResult {
  items: FeedPostResult[];
  nextCursor: FeedCursor | null;
  hasMore: boolean;
}

export interface PostDetailResult
  extends FeedPostResult {
  referencedPost: FeedPostResult | null;
}

export interface ProfileResult {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarSmallUrl: string | null;
  avatarLargeUrl: string | null;

  originalCount: number;
  followerCount: number;
  followingCount: number;
}
export interface MediaImage {
  altText: string;
  smallUrl: string;
  largeUrl: string;
}
export interface ProfileMediaResult {
  id: string;
  postId: string;
  createdAt: Date;
  images: MediaImage[];
}

export interface ProfileMediaPageResult {
  items: ProfileMediaResult[];
  nextCursor: FeedCursor | null;
  hasMore: boolean;
}

export interface CreatePostCommand {
  authorId: string;
  kind: PostKind;
  text?: string | null;
  replyToId?: string | null;
  repostOfId?: string | null;
}

export interface CreatedPostResult {
  id: string;
  authorId: string;
  kind: PostKind;
  text: string | null;
  replyToId: string | null;
  repostOfId: string | null;
  createdAt: Date;
}

export interface LikeResult {
  postId: string;
  likedByViewer: boolean;
  likeCount: number;
}

export type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'REFERENCE_NOT_FOUND'
  | 'INVALID_TARGET'
  | 'INTERNAL';

export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}