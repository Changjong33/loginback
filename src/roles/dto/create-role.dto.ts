import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: '역할 이름은 필수입니다.' })
  @IsString({ message: '역할 이름은 문자열이어야 합니다.' })
  @MinLength(2, { message: '역할 이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '역할 이름은 최대 50자까지 가능합니다.' })
  name: string;
}
