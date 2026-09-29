import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import type { User } from './user.entity';
import type { Post } from './post.entity';

@Entity({
  name: 'likes',
})
export class Like {
  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @PrimaryColumn({
    name: 'post_id',
    type: 'uuid',
  })
  postId: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    precision: 3,
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(
  'User',
  (user: User) => user.likes,
  {
    onDelete: 'CASCADE',
  },
)
@JoinColumn({
  name: 'user_id',
})
user: User;

  @ManyToOne(
    'Post',
    (post: Post) => post.likes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'post_id',
  })
  post: Post;
}