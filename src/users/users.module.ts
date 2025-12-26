import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entities/user.entity';
import { UserProfileImage } from './entities/user-profile-image.entity';
import { Roles } from 'src/roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UserProfileImage, Roles])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
