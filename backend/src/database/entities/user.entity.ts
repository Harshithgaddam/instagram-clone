import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Post } from './post.entity';
import { Like } from './like.entity';
import { Follow } from './follow.entity';
import { Session } from './session.entity';
import type { Relation } from 'typeorm';
@Entity({ name: 'users' })
@Unique('uq_users_handle', ['handle'])
@Check(
  'chk_users_handle_format',
  `"handle" ~ '^[a-z0-9_]{3,20}$'`,
)
@Check(
  'chk_users_display_name_len',
  'char_length("display_name") BETWEEN 1 AND 50',
)
@Check(
  'chk_users_bio_len',
  '"bio" IS NULL OR char_length("bio") <= 160',
)
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

  // Nullable only while legacy/fixture accounts may not have credentials.
  // New registrations must always supply a password hash.
  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @Column({
    name: 'disabled_at',
    type: 'timestamptz',
    precision: 3,
    nullable: true,
  })
  disabledAt: Date | null;

  @Column({
  type: 'integer',
  default: 1,
  })
  version: number;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Relation<Session[]>;
}
