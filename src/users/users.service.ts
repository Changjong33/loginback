import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
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

  // 유저 생성
  async create(userData: {
    email: string;
    password: string;
    nickname?: string;
  }): Promise<Users> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
}
