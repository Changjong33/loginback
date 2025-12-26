import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Users } from 'src/users/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';

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
      ],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 댓글과 대댓글을 별도로 로드 (parent가 null인 것만 댓글, 나머지는 대댓글)
    // 이렇게 하면 대댓글이 comments 배열에 중복으로 나타나지 않음
    const comments = await this.postsRepository.manager.find(Comment, {
      where: {
        post: { id },
        parent: IsNull(),
      },
      relations: [
        'user',
        'user.userProfileImage',
        'replies',
        'replies.user',
        'replies.user.userProfileImage',
      ],
      order: {
        createdAt: 'ASC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    post.comments = comments;

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'postImages'],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('게시물을 수정할 권한이 없습니다.');
    }

    // 캡션 업데이트
    if (updatePostDto.caption !== undefined) {
      post.caption = updatePostDto.caption;
    }

    // 이미지 업데이트
    if (updatePostDto.images !== undefined) {
      // 기존 이미지 삭제
      await this.postImagesRepository.remove(post.postImages);

      // 새 이미지 저장
      const images = updatePostDto.images.map((img, index) =>
        this.postImagesRepository.create({
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder ?? index,
          post,
        }),
      );

      await this.postImagesRepository.save(images);
    }

    await this.postsRepository.save(post);

    return this.findOne(id);
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

