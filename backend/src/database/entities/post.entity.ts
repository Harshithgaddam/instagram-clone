import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { User } from './user.entity';
import { PostMedia } from './post-media.entity';
import { Like } from './like.entity';

export enum PostKind {
  ORIGINAL = 'original',
  REPLY = 'reply',
  REPOST = 'repost',
}

@Entity({ name: 'posts' })
@Check(
  'chk_posts_kind',
  `"kind" IN ('original', 'reply', 'repost')`,
)
@Check(
  'chk_posts_kind_shape',
  `(
    (
      "kind" = 'original'
      AND "reply_to_id" IS NULL
      AND "repost_of_id" IS NULL
      AND "text" IS NOT NULL
      AND "text" = btrim("text")
      AND char_length("text") BETWEEN 1 AND 280
    )
    OR
    (
      "kind" = 'reply'
      AND "reply_to_id" IS NOT NULL
      AND "repost_of_id" IS NULL
      AND "text" IS NOT NULL
      AND "text" = btrim("text")
      AND char_length("text") BETWEEN 1 AND 280
    )
    OR
    (
      "kind" = 'repost'
      AND "repost_of_id" IS NOT NULL
      AND "reply_to_id" IS NULL
      AND "text" IS NULL
    )
  )`,
)
@Index(
  'uq_posts_one_repost_per_user',
  ['authorId', 'repostOfId'],
  { unique: true, where: `"kind" = 'repost'` },
)
@Index(
  'idx_posts_feed_order',
  ['createdAt', 'id'],
  {
    where: `"kind" = 'original'`,
  },
)
@Index(
  'idx_posts_reply_lookup',
  ['replyToId', 'createdAt', 'id'],
  {
    where: `"kind" = 'reply'`,
  },
)
@Index(
  'idx_posts_author_order',
  ['authorId', 'createdAt', 'id'],
  {
    where: `"kind" = 'original'`,
  },
)
export class Post {
 @PrimaryGeneratedColumn('uuid')
id: string;

  @Column({
    name: 'author_id',
    type: 'uuid',
  })
  authorId: string;

  @ManyToOne(
    'User',
    (user: User) => user.posts,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'author_id',
    foreignKeyConstraintName: 'posts_author_id_fkey',
  })
  author: User;

  @Column({
    type: 'text',
  })
  kind: PostKind;

  @Column({
    name: 'reply_to_id',
    type: 'uuid',
    nullable: true,
  })
  replyToId: string | null;

  @ManyToOne(
    () => Post,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'reply_to_id',
    foreignKeyConstraintName: 'posts_reply_to_id_fkey',
  })
  replyTo: Post | null;

  @Column({
    name: 'repost_of_id',
    type: 'uuid',
    nullable: true,
  })
  repostOfId: string | null;

  @ManyToOne(
    () => Post,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'repost_of_id',
    foreignKeyConstraintName: 'posts_repost_of_id_fkey',
  })
  repostOf: Post | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  text: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    precision: 3,
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToOne(() => PostMedia, (media) => media.post)
  media: PostMedia | null;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];
}
