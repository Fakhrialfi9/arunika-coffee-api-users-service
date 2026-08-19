import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import * as grpc from '@grpc/grpc-js';
import { load } from '@grpc/proto-loader';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';

const PROTO_PATH = join(process.cwd(), 'proto/users/v1/users.proto');
const PACKAGE = 'arunika.coffee.users.v1';
const TEST_ADDRESS = '127.0.0.1:50052';

type UsersClient = grpc.Client;

type UsersClientConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials,
) => UsersClient;

type GrpcPackage = {
  arunika?: {
    coffee?: {
      users?: {
        v1?: {
          UsersService?: UsersClientConstructor;
        };
      };
    };
  };
};

type GrpcUser = {
  uuid: string;
  username?: string;
  email?: string;
  phone?: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type CreateUserResponse = { user: GrpcUser };
type GetUserResponse = { user: GrpcUser };
type ListUsersResponse = {
  items: GrpcUser[];
  pagination: {
    page: number;
    limit: number;
    total: string | number;
    total_pages: number;
  };
};
type UpdateUserResponse = { user: GrpcUser };
type DeleteUserResponse = { uuid: string; deleted: boolean };

const unary = <TRequest, TResponse>(
  client: UsersClient,
  method: string,
  request: TRequest,
): Promise<TResponse> =>
  new Promise((resolve, reject) => {
    const rpc = (client as unknown as Record<string, unknown>)[method];

    if (typeof rpc !== 'function') {
      reject(new Error(`gRPC method ${method} is not available`));
      return;
    }

    (
      rpc as (
        request: TRequest,
        callback: grpc.requestCallback<TResponse>,
      ) => void
    ).call(client, request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });

describe('UsersService gRPC integration', () => {
  let app:
    Awaited<ReturnType<typeof NestFactory.createMicroservice>> | undefined;
  let client: UsersClient | undefined;

  beforeAll(async () => {
    app = await NestFactory.createMicroservice(AppModule, {
      transport: Transport.GRPC,
      options: {
        package: PACKAGE,
        protoPath: PROTO_PATH,
        url: TEST_ADDRESS,
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

    const packageDefinition = await load(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const grpcPackage = grpc.loadPackageDefinition(
      packageDefinition,
    ) as unknown as GrpcPackage;
    const service = grpcPackage.arunika?.coffee?.users?.v1?.UsersService;

    if (service === undefined) {
      throw new Error(`gRPC service ${PACKAGE}.UsersService is not available`);
    }

    client = new service(TEST_ADDRESS, grpc.credentials.createInsecure());
  });

  afterAll(async () => {
    client?.close();
    await app?.close();
  });

  it('completes the full CRUD flow through a real gRPC client', async () => {
    const uuid = randomUUID();
    const username = `grpc-${uuid.slice(0, 8)}`;
    const email = `grpc-${uuid}@example.com`;
    const phone = `+62812${Number.parseInt(
      uuid.replaceAll('-', '').slice(0, 8),
      16,
    )
      .toString()
      .padStart(8, '0')}`;

    const created = await unary<
      { username: string; email: string; phone: string },
      CreateUserResponse
    >(client!, 'CreateUser', {
      username,
      email,
      phone,
    });

    expect(created.user.uuid).toBeTruthy();
    expect(created.user.username).toBe(username);
    expect(created.user.email).toBe(email);
    expect(created.user.phone).toBe(phone);
    expect(created.user.is_active).toBe(true);
    expect(created.user.is_verified).toBe(false);

    const fetched = await unary<{ uuid: string }, GetUserResponse>(
      client!,
      'GetUser',
      { uuid: created.user.uuid },
    );
    expect(fetched.user.uuid).toBe(created.user.uuid);
    expect(fetched.user.email).toBe(email);

    const listed = await unary<
      {
        page: number;
        limit: number;
        search: string;
        sort_by: string;
        sort_order: string;
      },
      ListUsersResponse
    >(client!, 'ListUsers', {
      page: 1,
      limit: 10,
      search: username,
      sort_by: 'SORT_FIELD_CREATED_AT',
      sort_order: 'SORT_ORDER_DESC',
    });

    expect(listed.items.some((item) => item.uuid === created.user.uuid)).toBe(
      true,
    );
    expect(listed.pagination.page).toBe(1);
    expect(listed.pagination.limit).toBe(10);
    expect(Number(listed.pagination.total)).toBeGreaterThanOrEqual(1);

    const updated = await unary<
      {
        uuid: string;
        username: string;
        email: string;
        status: string;
        is_active: boolean;
        is_verified: boolean;
      },
      UpdateUserResponse
    >(client!, 'UpdateUser', {
      uuid: created.user.uuid,
      username: `${username}-updated`,
      email: `updated-${uuid}@example.com`,
      status: 'active',
      is_active: true,
      is_verified: true,
    });

    expect(updated.user.uuid).toBe(created.user.uuid);
    expect(updated.user.username).toBe(`${username}-updated`);
    expect(updated.user.status).toBe('active');
    expect(updated.user.is_verified).toBe(true);

    const deleted = await unary<{ uuid: string }, DeleteUserResponse>(
      client!,
      'DeleteUser',
      { uuid: created.user.uuid },
    );
    expect(deleted).toEqual({ uuid: created.user.uuid, deleted: true });

    await expect(
      unary<{ uuid: string }, GetUserResponse>(client!, 'GetUser', {
        uuid: created.user.uuid,
      }),
    ).rejects.toMatchObject({ code: grpc.status.NOT_FOUND });
  }, 30_000);
});
