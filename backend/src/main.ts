import { NestFactory } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

import {
  HttpExceptionFilter,
} from './common/http-exception.filter';

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule);

  const configService =
    app.get(ConfigService);

    const frontendOrigin =
  configService.get<string>(
    'frontendOrigin',
  );

app.enableCors({
  origin: frontendOrigin,
});

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  const port =
    configService.get<number>('port') ?? 3000;

  await app.listen(port);
}

bootstrap();