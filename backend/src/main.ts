import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { join } from 'node:path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app
    .getHttpAdapter()
    .getInstance()
    .use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const configService = app.get(ConfigService);

  const frontendOrigin =
    configService.getOrThrow<string>('frontendOrigin');

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
  });

  app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('port') ?? 3000;

  app.enableShutdownHooks();

  await app.listen(port);
}

bootstrap();