export type CreatePostKind = 'original' | 'reply' | 'repost';

export class CreatePostDto {
  authorId!: string;
  kind!: CreatePostKind;
  text?: string;
  replyToId?: string;
  repostOfId?: string;
}