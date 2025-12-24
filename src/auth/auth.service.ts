import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { Users } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  // ===============================
  // 회원가입
  // ===============================
  async register(email: string, password: string, nickname?: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      nickname,
    });

    return { id: user.id, email: user.email };
  }

  // ===============================
  // 로그인
  // ===============================
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    await this.tokenService.saveRefreshToken(refreshToken, user);

    return { accessToken, refreshToken };
  }

  // ===============================
  // Refresh Token 재발급
  // ===============================
  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  // ===============================
  // 로그아웃 (Refresh Token 무효화)
  // ===============================
  async logout(refreshToken: string) {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  // ===============================
  // 내부 유저 검증 로직
  // ===============================
  private async validateUser(email: string, password: string): Promise<Users> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 틀렸습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 틀렸습니다.');
    }

    return user;
  }
}
