import 'reflect-metadata';

import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module.js';
import { appConfig } from './config/app.config.js';

async function bootstrap(): Promise<void> {
  const config = appConfig();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'arunika.coffee.users.v1',
      protoPath: join(process.cwd(), 'proto/users/v1/users.proto'),
      url: `${config.grpcUsersHost}:${config.grpcUsersPort}`,
      maxReceiveMessageLength: config.securityGrpcMaxMessageBytes,
      maxSendMessageLength: config.securityGrpcMaxMessageBytes,
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

  logger.log(
    JSON.stringify({
      event: 'service.started',
      service: config.name,
      environment: config.environment,
      transport: 'grpc',
      address: `${config.grpcUsersHost}:${config.grpcUsersPort}`,
    }),
  );
}

void bootstrap();
