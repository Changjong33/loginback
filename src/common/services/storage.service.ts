import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSupabaseClient } from '../client/supabase.client';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Base64 이미지를 Supabase Storage에 업로드
   * @param base64Data Base64 인코딩된 이미지 데이터 (data:image/jpeg;base64,... 형식)
   * @param bucketName Storage 버킷 이름
   * @param fileName 저장할 파일 이름
   * @returns 업로드된 파일의 공개 URL
   */
  async uploadBase64Image(
    base64Data: string,
    bucketName: string,
    fileName: string,
  ): Promise<string> {
    try {
      const supabase = getSupabaseClient(this.configService);

      // Base64 데이터에서 실제 데이터 추출
      const base64Match = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid base64 image data');
      }

      const mimeType = base64Match[1];
      const base64String = base64Match[2];
      const buffer = Buffer.from(base64String, 'base64');

      // 파일 확장자 결정
      const extension = mimeType.split('/')[1] || 'jpg';
      const fullFileName = `${fileName}.${extension}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fullFileName, buffer, {
          contentType: mimeType,
          upsert: true, // 같은 이름의 파일이 있으면 덮어쓰기
        });

      if (error) {
        console.error('Supabase upload error:', {
          error: error.message,
          bucketName,
          fileName: fullFileName,
          errorName: error.name,
        });
        throw new Error(`Supabase Storage 업로드 실패: ${error.message}. 버킷 '${bucketName}'이 존재하는지 확인하세요.`);
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fullFileName);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('공개 URL을 가져올 수 없습니다.');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('StorageService.uploadBase64Image error:', error);
      throw error;
    }
  }

  /**
   * 파일 삭제
   * @param bucketName Storage 버킷 이름
   * @param fileName 삭제할 파일 이름
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    const supabase = getSupabaseClient(this.configService);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }
}

