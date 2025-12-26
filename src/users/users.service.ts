import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { Roles } from 'src/roles/entities/role.entity';
import { UserProfileImage } from './entities/user-profile-image.entity';
import { StorageService } from 'src/common/services/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    @InjectRepository(UserProfileImage)
    private readonly userProfileImageRepository: Repository<UserProfileImage>,
    private readonly storageService: StorageService,
  ) {}

  // 이메일로 유저 찾기 (로그인에서 사용)
  async findByEmail(email: string): Promise<Users | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  // ID로 유저 조회
  async findById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    // userProfileImage는 별도로 로드 (없을 수 있음)
    try {
      const profileImage = await this.userProfileImageRepository.findOne({
        where: { userId: id },
      });
      
      if (profileImage) {
        user.userProfileImage = profileImage;
      } else {
        user.userProfileImage = null;
      }
    } catch (error) {
      console.error('Error loading userProfileImage:', error);
      user.userProfileImage = null;
    }

    return user;
  }

  // 전체 유저 조회 (관리자용)
  async findAll(): Promise<Users[]> {
    return this.usersRepository.find({
      relations: ['roles'],
    });
  }

  // 유저 생성 (회원가입 시 USER 역할 자동 부여)
  async create(userData: {
    email: string;
    password: string;
    nickname?: string;
  }): Promise<Users> {
    // USER 역할 조회
    const userRole = await this.rolesRepository.findOne({
      where: { name: 'USER' },
    });

    if (!userRole) {
      throw new Error('USER 역할이 존재하지 않습니다.');
    }

    // 유저 생성 + 역할 지정
    const user = this.usersRepository.create({
      ...userData,
      roles: [userRole],
    });

    // 저장 → user_roles 자동 생성
    return this.usersRepository.save(user);
  }

  // 프로필 사진 업로드/수정
  async updateProfileImage(userId: string, base64Image: string): Promise<UserProfileImage> {
    // Supabase Storage에 업로드
    const fileName = `profile-${userId}-${Date.now()}`;
    const publicUrl = await this.storageService.uploadBase64Image(
      base64Image,
      'profile-images',
      fileName,
    );

    // 기존 프로필 사진 확인
    let profileImage = await this.userProfileImageRepository.findOne({
      where: { userId },
    });

    if (profileImage) {
      // 기존 파일 삭제 (선택사항 - 필요시)
      // 기존 URL에서 파일명 추출하여 삭제할 수 있지만, upsert로 덮어쓰므로 생략 가능
      
      // 기존 사진 업데이트
      profileImage.imageUrl = publicUrl;
      return this.userProfileImageRepository.save(profileImage);
    } else {
      // 새 프로필 사진 생성
      profileImage = this.userProfileImageRepository.create({
        userId,
        imageUrl: publicUrl,
      });
      return this.userProfileImageRepository.save(profileImage);
    }
  }
}
