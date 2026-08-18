import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSync } from '@grpc/proto-loader';
import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));
const protoPath = resolve(currentDir, '../../proto/users/v1/users.proto');

describe('Users gRPC contract', () => {
  it('loads the canonical v1 protobuf contract', () => {
    expect(existsSync(protoPath)).toBe(true);

    const packageDefinition = loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const service = packageDefinition['arunika.coffee.users.v1.UsersService'];

    expect(service).toBeDefined();
    expect(service?.format).toBe('Protocol Buffer 3 DescriptorProto');
    expect(service?.service).toBeDefined();

    const methods = Object.keys(service?.service ?? {});

    expect(methods).toEqual([
      'CreateUser',
      'GetUser',
      'ListUsers',
      'UpdateUser',
      'DeleteUser',
    ]);
  });

  it('defines all CRUD request and response messages', () => {
    const packageDefinition = loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const messageNames = [
      'User',
      'CreateUserRequest',
      'CreateUserResponse',
      'GetUserRequest',
      'GetUserResponse',
      'ListUsersRequest',
      'ListUsersResponse',
      'Pagination',
      'UpdateUserRequest',
      'UpdateUserResponse',
      'DeleteUserRequest',
      'DeleteUserResponse',
    ];

    for (const name of messageNames) {
      expect(packageDefinition[`arunika.coffee.users.v1.${name}`]).toBeDefined();
    }
  });
});
