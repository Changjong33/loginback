import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PostImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  sortOrder?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostImageDto)
  images: PostImageDto[];
}

