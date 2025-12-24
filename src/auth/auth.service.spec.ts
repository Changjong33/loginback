import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';
import { Users } from 'src/users/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed_password'),
  compare: jest.fn(async () => true),
}));

const mockUsersService = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const mockTokenService = () => ({
  generateAccessToken: jest.fn(() => 'access_token'),
  generateRefreshToken: jest.fn(() => 'refresh_token'),
  saveRefreshToken: jest.fn(),
});

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let tokenService: ReturnType<typeof mockTokenService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: TokenService, useFactory: mockTokenService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get(UsersService);
    tokenService = moduleRef.get(TokenService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('이메일 중복 시 BadRequestException', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1' } as Users);

      await expect(
        authService.register('test@test.com', 'password', 'nick'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('정상 회원가입 시 id/email 반환', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
      } as Users);

      const result = await authService.register(
        'test@test.com',
        'password',
        'nick',
      );

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'hashed_password',
        nickname: 'nick',
      });
      expect(result).toEqual({ id: 'user-id', email: 'test@test.com' });
    });
  });

  describe('login', () => {
    it('이메일이 없으면 UnauthorizedException', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('test@test.com', 'password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('비밀번호 불일치 시 UnauthorizedException', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      usersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: 'hashed_password',
      } as Users);

      await expect(
        authService.login('test@test.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('로그인 성공 시 액세스/리프레시 토큰 반환', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: 'hashed_password',
        roles: [],
      } as Users);

      const result = await authService.login('test@test.com', 'password');

      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      expect(tokenService.generateRefreshToken).toHaveBeenCalled();
      expect(tokenService.saveRefreshToken).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ id: 'user-id' }),
      );
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });
  });
});

