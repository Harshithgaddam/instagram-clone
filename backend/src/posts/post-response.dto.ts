// src/posts/post-response.dto.ts

export class PostAuthorDto {
  id: string;
  handle: string;
  displayName: string;
  avatar: {
    smallUrl: string;
    largeUrl: string;
  };
}

export class PostMediaDto {
  id: string;
  altText: string;
  width: number;
  height: number;
  position: number;
  smallUrl: string;
  largeUrl: string;
}

export class PostResponseDto {
  id: string;
  kind: 'original' | 'reply' | 'repost';
  text: string | null;
  createdAt: string;

  author: PostAuthorDto;

  media: PostMediaDto[];

  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;

  replyToId: string | null;
  repostOfId: string | null;
}

export class PostDetailResponseDto {
  item: PostResponseDto;

  referencedPost?: PostResponseDto;
}