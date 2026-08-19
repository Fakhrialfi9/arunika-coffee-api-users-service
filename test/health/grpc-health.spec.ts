import { join } from 'node:path';

import * as grpc from '@grpc/grpc-js';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { load } from '@grpc/proto-loader';
import { Transport } from '@nestjs/microservices';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { DatabaseHealthService } from '../../src/infrastructure/database/database-health.service.js';
import { GrpcHealthService } from '../../src/infrastructure/health/grpc-health.service.js';

const TEST_ADDRESS = '127.0.0.1:50053';
const USERS_PROTO_PATH = join(
  process.cwd(),
  'proto/users/v1/users.proto',
);

const SERVICE_NAMES = {
  overall: '',
  liveness: 'liveness',
  readiness: 'readiness',
};

type HealthClient = grpc.Client & {
  check: (
    request: { service: string },
    callback: (
      error: grpc.ServiceError | null,
      response: { status: string } | undefined,
    ) => void,
  ) => void;
};

type HealthPackage = {
  grpc?: {
    health?: {
      v1?: {
        Health?: new (
          address: string,
          credentials: grpc.ChannelCredentials,
        ) => HealthClient;
      };
    };
  };
};

const checkHealth = (
  client: HealthClient,
  service: string,
): Promise<{ status: string }> =>
  new Promise((resolve, reject) => {
    client.check({ service }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (response === undefined) {
        reject(new Error('Health response is undefined'));
        return;
      }

      resolve(response);
    });
  });

describe('gRPC health and readiness', () => {
  let moduleRef: TestingModule;
  let app: ReturnType<TestingModule['createNestMicroservice']>;
  let healthService: GrpcHealthService;
  let databaseCheck: ReturnType<typeof vi.fn>;
  let client: HealthClient;

  beforeAll(async () => {
    databaseCheck = vi.fn().mockResolvedValue(false);

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseHealthService)
      .useValue({ check: databaseCheck })
      .compile();

    healthService = moduleRef.get(GrpcHealthService);

    app = moduleRef.createNestMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'arunika.coffee.users.v1',
        protoPath: [healthCheckProtoPath, USERS_PROTO_PATH],
        url: TEST_ADDRESS,
        onLoadPackageDefinition: (
          _packageDefinition: unknown,
          server: grpc.Server,
        ): void => {
          healthService.attach(server);
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

    await app.listen();
    await healthService.startMonitoring();

    const packageDefinition = await load(healthCheckProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const grpcPackage = grpc.loadPackageDefinition(
      packageDefinition,
    ) as unknown as HealthPackage;
    const Health = grpcPackage.grpc?.health?.v1?.Health;

    if (Health === undefined) {
      throw new Error('gRPC Health service is not available');
    }

    client = new Health(TEST_ADDRESS, grpc.credentials.createInsecure());
  });

  afterAll(async () => {
    client?.close();
    await app?.close();
    await moduleRef?.close();
  });

  it('keeps liveness healthy while readiness is not ready when database is unavailable', async () => {
    await expect(
      checkHealth(client, SERVICE_NAMES.liveness),
    ).resolves.toMatchObject({ status: 'SERVING' });

    await expect(
      checkHealth(client, SERVICE_NAMES.readiness),
    ).resolves.toMatchObject({ status: 'NOT_SERVING' });

    await expect(
      checkHealth(client, SERVICE_NAMES.overall),
    ).resolves.toMatchObject({ status: 'NOT_SERVING' });
  });

  it('becomes ready when the database health check recovers', async () => {
    databaseCheck.mockResolvedValue(true);
    await healthService.refresh();

    await expect(
      checkHealth(client, SERVICE_NAMES.liveness),
    ).resolves.toMatchObject({ status: 'SERVING' });

    await expect(
      checkHealth(client, SERVICE_NAMES.readiness),
    ).resolves.toMatchObject({ status: 'SERVING' });

    await expect(
      checkHealth(client, SERVICE_NAMES.overall),
    ).resolves.toMatchObject({ status: 'SERVING' });
  });
});
