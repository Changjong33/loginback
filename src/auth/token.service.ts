import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { Users } from 'src/users/entities/user.entity';
import { RefreshTokens } from './entities/refreshToken.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(RefreshTokens)
    private readonly refreshTokenRepository: Repository<RefreshTokens>,
  ) {}

  generateAccessToken(user: Users) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((r) => r.name) || [],
    };

    return this.jwtService.sign(payload);
  }

  generateRefreshToken(user: Users) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
  }

  async saveRefreshToken(token: string, user: Users) {
    return this.refreshTokenRepository.save({
      token,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  async rotateRefreshToken(oldToken: string) {
    const savedToken = await this.refreshTokenRepository.findOne({
      where: { token: oldToken },
      relations: ['user', 'user.roles'],
    });

    if (!savedToken) {
      throw new UnauthorizedException('유효하지 않은 refresh token');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(oldToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('만료된 refresh token');
    }

    const user = savedToken.user;

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    await this.refreshTokenRepository.delete({ id: savedToken.id });
    await this.saveRefreshToken(newRefreshToken, user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
