import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import type { User } from './user.entity';

@Entity({ name: 'follows' })
@Check(
  'chk_follows_no_self_follow',
  '"follower_id" <> "following_id"',
)
@Index('idx_follows_following_id', ['followingId'])
export class Follow {
  @PrimaryColumn({
    name: 'follower_id',
    type: 'uuid',
  })
  followerId: string;

  @PrimaryColumn({
    name: 'following_id',
    type: 'uuid',
  })
  followingId: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    precision: 3,
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(
    'User',
    (user: User) => user.followers,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'follower_id',
    foreignKeyConstraintName: 'follows_follower_id_fkey',
  })
  follower: User;

  @ManyToOne(
    'User',
    (user: User) => user.following,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'following_id',
    foreignKeyConstraintName: 'follows_following_id_fkey',
  })
  following: User;
}
