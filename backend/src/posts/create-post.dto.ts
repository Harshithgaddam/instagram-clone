export type CreatePostKind = 'original' | 'reply' | 'repost';

export class CreatePostDto {
  kind!: CreatePostKind;
  text?: string;
  replyToId?: string;
  repostOfId?: string;
}