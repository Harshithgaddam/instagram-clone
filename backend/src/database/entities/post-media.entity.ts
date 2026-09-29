import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MediaImage } from '../../data/repository.types';
import type { Post } from './post.entity';

@Entity({
  name: 'post_media',
})
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'post_id',
    type: 'uuid',
    unique: true,
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
  })
  post: Post;

  @Column({
    type: 'jsonb',
  })
  images: MediaImage[];
}