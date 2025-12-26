import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostImage)
    private readonly postImagesRepository: Repository<PostImage>,
  ) {}

  async create(createPostDto: CreatePostDto, user: Users): Promise<Post> {
    const post = this.postsRepository.create({
      caption: createPostDto.caption,
      user,
    });

    const savedPost = await this.postsRepository.save(post);

    // 이미지 저장
    const images = createPostDto.images.map((img, index) =>
      this.postImagesRepository.create({
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder ?? index,
        post: savedPost,
      }),
    );

    await this.postImagesRepository.save(images);

    return this.findOne(savedPost.id);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['user', 'postImages', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: [
        'user',
        'user.userProfileImage',
        'postImages',
        'comments',
        'comments.user',
        'comments.user.userProfileImage',
        'comments.replies',
        'comments.replies.user',
        'comments.replies.user.userProfileImage',
      ],
      order: {
        comments: {
          createdAt: 'ASC',
          replies: {
            createdAt: 'ASC',
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    return post;
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.remove(post);
  }
}

