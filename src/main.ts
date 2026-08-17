import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './config/app.config.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const host = config.getOrThrow<AppConfig['host']>('app.host');
  const port = config.getOrThrow<AppConfig['port']>('app.port');

  app.enableShutdownHooks();

  await app.listen(port, host);
}

void bootstrap();
