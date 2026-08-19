import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './env.validation.js';

const baseEnvironment = {
  NODE_ENV: 'production',
  APP_NAME: 'arunika-coffee-api-users-service',
  APP_HOST: '0.0.0.0',
  APP_PORT: '3000',
  DATABASE_HOST: 'db.internal',
  DATABASE_PORT: '3306',
  DATABASE_NAME: 'arunika_coffee_users',
  DATABASE_USER: 'arunika_users_prod',
  DATABASE_PASSWORD: 'a-strong-production-secret',
  DATABASE_URL:
    'mysql://arunika_users_prod:a-strong-production-secret@db.internal:3306/arunika_coffee_users',
  DATABASE_POOL_CONNECTION_LIMIT: '10',
  DATABASE_CONNECT_TIMEOUT_MS: '5000',
  DATABASE_ACQUIRE_TIMEOUT_MS: '10000',
  DATABASE_POOL_IDLE_TIMEOUT_SEC: '300',
  GRPC_USERS_HOST: '0.0.0.0',
  GRPC_USERS_PORT: '50051',
  USERS_GRPC_TIMEOUT_MS: '3000',
  SECURITY_CORS_ORIGINS: 'https://app.arunika.coffee',
  SECURITY_RATE_LIMIT_TTL: '60000',
  SECURITY_RATE_LIMIT_MAX: '100',
  SECURITY_BODY_LIMIT: '1mb',
  SECURITY_GRPC_MAX_MESSAGE_BYTES: '1048576',
  SECURITY_TRUST_PROXY: '10.0.0.0/8',
  LOG_ENABLED: 'true',
  LOG_LEVEL: 'info',
  OTEL_SERVICE_NAME: 'arunika-coffee-api-users-service',
  OTEL_TRACING_ENABLED: 'true',
  OTEL_TRACES_SAMPLER_ARG: '0.1',
  OTEL_METRICS_ENABLED: 'true',
  OTEL_METRIC_EXPORT_INTERVAL: '60000',
};

describe('validateEnvironment', () => {
  it('accepts a production-safe configuration', () => {
    expect(() => validateEnvironment(baseEnvironment)).not.toThrow();
  });

  it('rejects local database hosts in production', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, DATABASE_HOST: 'localhost' }),
    ).toThrow('DATABASE_HOST must not point to localhost in production');
  });

  it('rejects weak production database credentials', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, DATABASE_PASSWORD: 'dev123' }),
    ).toThrow('DATABASE_PASSWORD must use a strong production secret');
  });

  it('rejects debug logging in production', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, LOG_LEVEL: 'debug' }),
    ).toThrow('LOG_LEVEL must not be debug or verbose in production');
  });

  it('rejects local CORS origins in production', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        SECURITY_CORS_ORIGINS: 'https://app.arunika.coffee,http://localhost:3000',
      }),
    ).toThrow(
      'SECURITY_CORS_ORIGINS must not contain local development origins in production',
    );
  });
});
