// // // src/data/post.repository.ts

// // export type PostKind = 'original' | 'reply' | 'repost';

// // export interface Post {
// //   id: string;
// //   kind: PostKind;
// //   authorId: string;
// //   text: string | null;
// //   createdAt: string;
// //   replyToId?: string;
// //   repostOfId?: string;
// // }

// // export interface Media {
// //   id: string;
// //   postId: string;
// //   altText: string;
// //   width: number;
// //   height: number;
// //   position: number;
// //   smallUrl: string;
// //   largeUrl: string;
// // }

// // export interface FindPostsOptions {
// //   authorId?: string;
// //   kind?: PostKind;
// //   limit?: number;
// //   cursorCreatedAt?: string;
// //   cursorId?: string;
// // }

// // export interface PostRepository {
// //   findAll(options?: FindPostsOptions): Promise<Post[]>;

// //   findById(id: string): Promise<Post | null>;

// //   findMediaByPostId(postId: string): Promise<Media[]>;

// //   countLikes(postId: string): Promise<number>;

// //   countReplies(postId: string): Promise<number>;

// //   isLikedByUser(
// //     postId: string,
// //     userId: string,
// //   ): Promise<boolean>;
// // }

// import {
//   CreatePostCommand,
//   CreatedPostResult,
//   FeedCursor,
//   FeedPageResult,
//   LikeResult,
//   PostDetailResult,
//   ProfileMediaPageResult,
// } from './repository.types';

// export interface PostRepository {
//   listOriginalFeed(
//     cursor: FeedCursor | null,
//     limit: number,
//     viewerId: string,
//   ): Promise<FeedPageResult>;

//   getPostDetail(
//     postId: string,
//     viewerId: string,
//   ): Promise<PostDetailResult | null>;

//   listDirectReplies(
//     postId: string,
//     cursor: FeedCursor | null,
//     limit: number,
//     viewerId: string,
//   ): Promise<FeedPageResult>;

//   listProfileMedia(
//     userId: string,
//     cursor: FeedCursor | null,
//     limit: number,
//   ): Promise<ProfileMediaPageResult>;

//   searchOriginals(
//     query: string,
//     cursor: FeedCursor | null,
//     limit: number,
//     viewerId: string,
//   ): Promise<FeedPageResult>;

//   createPost(
//     command: CreatePostCommand,
//   ): Promise<CreatedPostResult>;

//   setLike(
//     postId: string,
//     viewerId: string,
//     desiredState: boolean,
//   ): Promise<LikeResult>;
// }
import {
  CreatePostCommand,
  CreatedPostResult,
  FeedCursor,
  FeedPageResult,
  LikeResult,
  PostDetailResult,
  ProfileMediaPageResult,
  MediaImage,
} from './repository.types';

export interface FindPostsOptions {
  kind?: 'original' | 'reply' | 'repost';

  authorId?: string;

  limit?: number;

  offset?: number;

  cursorCreatedAt?: Date;

  cursorId?: string;
}

export interface Media {
  id: string;
  postId: string;
  images: MediaImage[];
}

export interface Post {
  id: string;

  authorId: string;

  kind:
    | 'original'
    | 'reply'
    | 'repost';

  text: string | null;

  replyToId: string | null;

  repostOfId: string | null;

  createdAt: Date;
}

export interface PostRepository {

  // =====================================================
  // EXISTING METHODS
  // =====================================================

  findAll(
    options?: FindPostsOptions,
  ): Promise<Post[]>;

  findById(
    id: string,
  ): Promise<Post | null>;

  findMediaByPostId(
    postId: string,
  ): Promise<Media[]>;

  countLikes(
    postId: string,
  ): Promise<number>;

  countReplies(
    postId: string,
  ): Promise<number>;

  isLikedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean>;

  // =====================================================
  // C2 METHODS
  // =====================================================

  listOriginalFeed(
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult>;

  getPostDetail(
    postId: string,
    viewerId: string,
  ): Promise<PostDetailResult | null>;

  listDirectReplies(
    postId: string,
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult>;

  listProfileMedia(
    userId: string,
    cursor: FeedCursor | null,
    limit: number,
  ): Promise<ProfileMediaPageResult>;

  searchOriginals(
    query: string,
    cursor: FeedCursor | null,
    limit: number,
    viewerId: string,
  ): Promise<FeedPageResult>;

  createPost(
    command: CreatePostCommand,
  ): Promise<CreatedPostResult>;

  setLike(
    postId: string,
    viewerId: string,
    desiredState: boolean,
  ): Promise<LikeResult>;
}