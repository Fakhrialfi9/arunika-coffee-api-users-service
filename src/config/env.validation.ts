import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsString()
  @IsNotEmpty()
  APP_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT = 3306;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsUrl({
    require_tld: false,
    protocols: ['mysql'],
  })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  GRPC_USERS_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  GRPC_USERS_PORT = 50051;

  @IsInt()
  @Min(1)
  USERS_GRPC_TIMEOUT_MS = 3000;

  @IsString()
  @IsNotEmpty()
  SECURITY_CORS_ORIGINS!: string;

  @IsInt()
  @Min(1)
  SECURITY_RATE_LIMIT_TTL = 60000;

  @IsInt()
  @Min(1)
  SECURITY_RATE_LIMIT_MAX = 100;

  @IsString()
  @IsNotEmpty()
  SECURITY_BODY_LIMIT = '1mb';

  @IsString()
  @IsNotEmpty()
  SECURITY_TRUST_PROXY = 'loopback';

  @IsBooleanString()
  LOG_ENABLED = 'true';

  @IsString()
  @IsNotEmpty()
  LOG_LEVEL = 'debug';

  @IsString()
  @IsNotEmpty()
  OTEL_SERVICE_NAME!: string;

  @IsBooleanString()
  OTEL_TRACING_ENABLED = 'true';

  @IsString()
  @IsNotEmpty()
  OTEL_TRACES_SAMPLER_ARG = '1';

  @IsBooleanString()
  OTEL_METRICS_ENABLED = 'true';

  @IsInt()
  @Min(1)
  OTEL_METRIC_EXPORT_INTERVAL = 60000;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
