import 'reflect-metadata';

import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

import type { AppConfig } from './config/app.config.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const host = config.getOrThrow<AppConfig['host']>('app.host');
  const port = config.getOrThrow<AppConfig['port']>('app.port');
  const grpcUsersHost =
    config.getOrThrow<AppConfig['grpcUsersHost']>('app.grpcUsersHost');
  const grpcUsersPort =
    config.getOrThrow<AppConfig['grpcUsersPort']>('app.grpcUsersPort');

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'arunika.coffee.users.v1',
      protoPath: join(process.cwd(), 'proto/users/v1/users.proto'),
      url: `${grpcUsersHost}:${grpcUsersPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.listen(port, host);
}

void bootstrap();
