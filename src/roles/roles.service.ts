import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
  ) {}

  // 역할 생성
  async create(createRoleDto: CreateRoleDto): Promise<Roles> {
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('이미 존재하는 역할 이름입니다.');
    }

    const role = this.rolesRepository.create(createRoleDto);
    return this.rolesRepository.save(role);
  }

  // 전체 역할 조회
  async findAll(): Promise<Roles[]> {
    return this.rolesRepository.find({
      relations: ['users'],
    });
  }

  // 특정 역할 조회
  async findOne(id: number): Promise<Roles> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('역할을 찾을 수 없습니다.');
    }

    return role;
  }

  // 역할 이름으로 조회
  async findByName(name: string): Promise<Roles | null> {
    return this.rolesRepository.findOne({
      where: { name },
      relations: ['users'],
    });
  }

  // 역할 수정
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Roles> {
    const role = await this.findOne(id);

    // 이름 변경 시 중복 체크
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('이미 존재하는 역할 이름입니다.');
      }
    }

    Object.assign(role, updateRoleDto);
    return this.rolesRepository.save(role);
  }

  // 역할 삭제
  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.remove(role);
  }
}
