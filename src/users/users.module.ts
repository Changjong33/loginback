import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entities/user.entity';
import { UserProfileImage } from './entities/user-profile-image.entity';
import { Roles } from 'src/roles/entities/role.entity';
import { StorageService } from 'src/common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UserProfileImage, Roles])],
  controllers: [UsersController],
  providers: [UsersService, StorageService],
  exports: [UsersService],
})
export class UsersModule {}
