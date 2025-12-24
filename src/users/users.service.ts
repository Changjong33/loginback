import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { Roles } from 'src/roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
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
}
