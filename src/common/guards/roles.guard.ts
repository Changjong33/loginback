import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // 역할 제한이 없으면 통과
    }

    const request = context.switchToHttp().getRequest();
    const user: Users = request.user;

    if (!user) {
      throw new ForbiddenException('인증된 사용자 정보를 찾을 수 없습니다.');
    }

    // user.roles가 로드되지 않았을 수 있으므로 확인
    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    // 사용자의 역할 이름 목록
    const userRoles = user.roles.map((role) => role.name);

    // 필요한 역할 중 하나라도 가지고 있는지 확인
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }

    return true;
  }
}

