// src/data/post.repository.ts

export type PostKind = 'original' | 'reply' | 'repost';

export interface Post {
  id: string;
  kind: PostKind;
  authorId: string;
  text: string | null;
  createdAt: string;
  replyToId?: string;
  repostOfId?: string;
}

export interface Media {
  id: string;
  postId: string;
  altText: string;
  width: number;
  height: number;
  position: number;
  smallUrl: string;
  largeUrl: string;
}

export interface FindPostsOptions {
  authorId?: string;
  kind?: PostKind;
  limit?: number;
  cursorCreatedAt?: string;
  cursorId?: string;
}

export interface PostRepository {
  findAll(options?: FindPostsOptions): Promise<Post[]>;

  findById(id: string): Promise<Post | null>;

  findMediaByPostId(postId: string): Promise<Media[]>;

  countLikes(postId: string): Promise<number>;

  countReplies(postId: string): Promise<number>;

  isLikedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean>;
}