import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Index('user_profile_images_pkey', ['userId'], { unique: true })
@Entity('user_profile_images')
export class UserProfileImage {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column('varchar', { name: 'image_url', length: 500 })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Users, (user) => user.userProfileImage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;
}

