import { join } from 'node:path';

import * as grpc from '@grpc/grpc-js';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { loadSync } from '@grpc/proto-loader';
import { Transport } from '@nestjs/microservices';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { DatabaseHealthService } from '../../src/infrastructure/database/database-health.service.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { GrpcHealthService } from '../../src/infrastructure/health/grpc-health.service.js';

const TEST_ADDRESS = '127.0.0.1:50054';
const USERS_PROTO_PATH = join(process.cwd(), 'proto/users/v1/users.proto');

const SERVICE_NAMES = {
  liveness: 'liveness',
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

const createHealthClient = (): HealthClient => {
  const packageDefinition = loadSync(healthCheckProtoPath, {
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

  return new Health(TEST_ADDRESS, grpc.credentials.createInsecure());
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

describe('gRPC graceful shutdown', () => {
  let moduleRef: TestingModule;
  let app: ReturnType<TestingModule['createNestMicroservice']>;
  let healthService: GrpcHealthService;
  let client: HealthClient;
  let disconnect: ReturnType<typeof vi.fn>;
  let appClosed = false;

  beforeEach(async () => {
    appClosed = false;
    disconnect = vi.fn().mockResolvedValue(undefined);

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseHealthService)
      .useValue({ check: vi.fn().mockResolvedValue(true) })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: vi.fn().mockResolvedValue(undefined),
        $disconnect: disconnect,
        onApplicationShutdown: disconnect,
      })
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
          server: unknown,
        ): void => {
          healthService.attach(server as grpc.Server);
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
    client = createHealthClient();
  });

  afterEach(async () => {
    client?.close();

    if (!appClosed) {
      await app?.close();
    }

    await moduleRef?.close();
  });

  it('closes the gRPC server and disconnects the database on application shutdown', async () => {
    await expect(
      checkHealth(client, SERVICE_NAMES.liveness),
    ).resolves.toMatchObject({ status: 'SERVING' });

    await app.close();
    appClosed = true;

    expect(disconnect).toHaveBeenCalled();

    await expect(
      checkHealth(client, SERVICE_NAMES.liveness),
    ).rejects.toMatchObject({ code: grpc.status.UNAVAILABLE });
  });
});
