import {
  Column,
  Entity,
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

@Entity({
  name: 'posts',
})
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

  @OneToOne(
    () => PostMedia,
    (media) => media.post,
  )
  media: PostMedia | null;

  @OneToMany(
    () => Like,
    (like) => like.post,
  )
  likes: Like[];
}