import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:3000',
    'https://loginfront-efanb2yqk-changjongs-projects.vercel.app',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없으면 (같은 도메인 요청 등) 허용
      if (!origin) {
        return callback(null, true);
      }
      // 허용된 origin 목록에 있으면 허용
      if (origins.includes(origin)) {
        return callback(null, true);
      }
      // 개발 환경에서는 모든 origin 허용 (선택사항)
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 전역 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 값 제거
      forbidNonWhitelisted: true, // 이상한 값 오면 400
      transform: true,
    }),
  );

  // 전역 필터 (순서 중요: AllExceptionsFilter가 마지막에 와야 함)
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

  // 전역 인터셉터
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new TimeoutInterceptor(5000), // 5초 타임아웃
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
