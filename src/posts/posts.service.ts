import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Users } from 'src/users/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { StorageService } from 'src/common/services/storage.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostImage)
    private readonly postImagesRepository: Repository<PostImage>,
    private readonly storageService: StorageService,
  ) {}

  async create(createPostDto: CreatePostDto, user: Users): Promise<Post> {
    const post = this.postsRepository.create({
      caption: createPostDto.caption,
      user,
    });

    const savedPost = await this.postsRepository.save(post);

    // 이미지가 있는 경우에만 업로드
    if (createPostDto.images && createPostDto.images.length > 0) {
      try {
        // 이미지를 Supabase Storage에 업로드하고 저장
        const uploadedImages = await Promise.all(
          createPostDto.images.map(async (img, index) => {
            try {
              // Base64 이미지를 Supabase에 업로드
              const fileName = `post-${savedPost.id}-${index}-${Date.now()}`;
              const publicUrl = await this.storageService.uploadBase64Image(
                img.imageUrl,
                'post-images',
                fileName,
              );

              return this.postImagesRepository.create({
                imageUrl: publicUrl,
                sortOrder: img.sortOrder ?? index,
                post: savedPost,
              });
            } catch (error) {
              console.error(`Failed to upload image ${index}:`, error);
              throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
          }),
        );

        await this.postImagesRepository.save(uploadedImages);
      } catch (error) {
        // 이미지 업로드 실패 시 게시물도 삭제
        await this.postsRepository.remove(savedPost);
        console.error('Failed to upload images, post deleted:', error);
        throw error;
      }
    }

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
      ],
      order: {
        createdAt: 'ASC',
      },
    });

    // 대댓글을 재귀적으로 로드하는 헬퍼 함수
    // 부모 댓글 바로 아래에 자식 댓글이 표시되도록 createdAt으로 정렬
    const loadNestedReplies = async (comment: Comment): Promise<void> => {
      // 직접 자식 댓글만 로드 (1단계만)
      const directReplies = await this.postsRepository.manager.find(Comment, {
        where: {
          parent: { id: comment.id },
        },
        relations: [
          'user',
          'user.userProfileImage',
        ],
        order: {
          createdAt: 'ASC', // 생성 시간 순으로 정렬하여 부모 바로 아래에 표시
        },
      });
      
      comment.replies = directReplies;
      
      // 각 대댓글에 대해 재귀적으로 더 깊은 대댓글 로드
      for (const reply of directReplies) {
        await loadNestedReplies(reply);
      }
    };

    // 모든 댓글에 대해 중첩된 대댓글 로드
    for (const comment of comments) {
      await loadNestedReplies(comment);
    }

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
      // 기존 이미지 삭제 (Supabase Storage에서도 삭제)
      await Promise.all(post.postImages.map(async (img) => {
        const fileName = img.imageUrl.split('/').pop(); // URL에서 파일명 추출
        if (fileName) {
          try {
            await this.storageService.deleteFile('post-images', fileName);
          } catch (error) {
            console.error('Failed to delete image from Supabase:', error);
          }
        }
      }));
      await this.postImagesRepository.remove(post.postImages);

      // 새 이미지를 Supabase Storage에 업로드하고 저장
      const uploadedImages = await Promise.all(
        updatePostDto.images.map(async (img, index) => {
          // 이미 URL인 경우 (이미 Supabase에 업로드된 경우) 그대로 사용
          // Base64인 경우에만 업로드
          let publicUrl = img.imageUrl;
          
          if (img.imageUrl.startsWith('data:image/')) {
            // Base64 이미지를 Supabase에 업로드
            const fileName = `post-${post.id}-${index}-${Date.now()}`;
            publicUrl = await this.storageService.uploadBase64Image(
              img.imageUrl,
              'post-images',
              fileName,
            );
          }

          // post 관계를 명시적으로 설정
          const postImage = this.postImagesRepository.create({
            imageUrl: publicUrl,
            sortOrder: img.sortOrder ?? index,
          });
          postImage.post = post; // post 관계 명시적으로 설정
          return postImage;
        }),
      );

      await this.postImagesRepository.save(uploadedImages);
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

