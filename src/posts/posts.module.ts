import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { UsersModule } from 'src/users/users.module';
import { StorageService } from 'src/common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostImage, Comment]), UsersModule],
  controllers: [PostsController],
  providers: [PostsService, StorageService],
  exports: [PostsService],
})
export class PostsModule {}

