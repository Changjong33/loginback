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
