import 'reflect-metadata';

import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module.js';
import { appConfig } from './config/app.config.js';

async function bootstrap(): Promise<void> {
  const config = appConfig();

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'arunika.coffee.users.v1',
      protoPath: join(process.cwd(), 'proto/users/v1/users.proto'),
      url: `${config.grpcUsersHost}:${config.grpcUsersPort}`,
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
  await app.listen();
}

void bootstrap();
