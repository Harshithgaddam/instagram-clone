import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';
import { Like } from './like.entity';
import { Follow } from './follow.entity';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'citext',
    unique: true,
  })
  handle: string;

  @Column({
    name: 'display_name',
    type: 'text',
  })
  displayName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio: string | null;

  @Column({
    name: 'avatar_small_url',
    type: 'text',
    nullable: true,
  })
  avatarSmallUrl: string | null;

  @Column({
    name: 'avatar_large_url',
    type: 'text',
    nullable: true,
  })
  avatarLargeUrl: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    precision: 3,
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(
    () => Post,
    (post) => post.author,
  )
  posts: Post[];

  @OneToMany(
    () => Like,
    (like) => like.user,
  )
  likes: Like[];

  @OneToMany(
    () => Follow,
    (follow) => follow.follower,
  )
  following: Follow[];

  @OneToMany(
    () => Follow,
    (follow) => follow.following,
  )
  followers: Follow[];
}