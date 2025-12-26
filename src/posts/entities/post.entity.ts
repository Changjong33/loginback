import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { PostImage } from './post-image.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Index('posts_pkey', ['id'], { unique: true })
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  caption: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Users, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(() => PostImage, (postImage) => postImage.post, { cascade: true })
  postImages: PostImage[];

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];
}

