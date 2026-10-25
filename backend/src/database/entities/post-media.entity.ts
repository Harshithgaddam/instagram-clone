import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { MediaImage } from '../../data/repository.types';
import type { Post } from './post.entity';

@Entity({ name: 'post_media' })
@Unique('post_media_post_id_key', ['postId'])
@Check(
  'chk_media_images_shape',
  `jsonb_typeof("images") = 'array'
   AND jsonb_array_length("images") BETWEEN 1 AND 4`,
)
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
id: string;

  @Column({
    name: 'post_id',
    type: 'uuid',
  })
  postId: string;

  @OneToOne(
    'Post',
    (post: Post) => post.media,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'post_id',
    foreignKeyConstraintName: 'post_media_post_id_fkey',
  })
  post: Post;

  @Column({
    type: 'jsonb',
  })
  images: MediaImage[];
}
