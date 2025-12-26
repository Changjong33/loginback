import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Users } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 전체 유저 조회 (관리자용)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  // 내 프로필 조회 (반드시 :id 라우트보다 먼저 정의해야 함)
  @Get('me')
  async getProfile(@GetUser() user: Users) {
    try {
      return await this.usersService.findById(user.id);
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  // 특정 유저 조회 (me보다 나중에 정의)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
