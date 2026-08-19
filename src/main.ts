import 'reflect-metadata';

import { join } from 'node:path';

import type { Server } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';

import { AppModule } from './app.module.js';
import { appConfig } from './config/app.config.js';
import { GrpcHealthService } from './infrastructure/health/grpc-health.service.js';

async function bootstrap(): Promise<void> {
  const config = appConfig();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'arunika.coffee.users.v1',
      protoPath: [
        healthCheckProtoPath,
        join(process.cwd(), 'proto/users/v1/users.proto'),
      ],
      url: `${config.grpcUsersHost}:${config.grpcUsersPort}`,
      maxReceiveMessageLength: config.securityGrpcMaxMessageBytes,
      maxSendMessageLength: config.securityGrpcMaxMessageBytes,
      onLoadPackageDefinition: (
        _packageDefinition: unknown,
        server: unknown,
      ): void => {
        healthService.attach(server as Server);
      },
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  const healthService = app.get(GrpcHealthService);

  app.enableShutdownHooks();
  await app.listen();
  await healthService.startMonitoring();

  logger.log(
    JSON.stringify({
      event: 'service.started',
      service: config.name,
      environment: config.environment,
      transport: 'grpc',
      address: `${config.grpcUsersHost}:${config.grpcUsersPort}`,
      health: {
        liveness: 'liveness',
        readiness: 'readiness',
      },
    }),
  );
}

void bootstrap();
