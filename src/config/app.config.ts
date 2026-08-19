import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  environment: string;
  host: string;
  port: number;
  grpcUsersHost: string;
  grpcUsersPort: number;
  securityGrpcMaxMessageBytes: number;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  name: process.env.APP_NAME ?? 'arunika-coffee-api-users-service',
  environment: process.env.NODE_ENV ?? 'development',
  host: process.env.APP_HOST ?? '0.0.0.0',
  port: Number(process.env.APP_PORT ?? 3000),
  grpcUsersHost: process.env.GRPC_USERS_HOST ?? '0.0.0.0',
  grpcUsersPort: Number(process.env.GRPC_USERS_PORT ?? 50051),
  securityGrpcMaxMessageBytes: Number(
    process.env.SECURITY_GRPC_MAX_MESSAGE_BYTES ?? 1024 * 1024,
  ),
}));
