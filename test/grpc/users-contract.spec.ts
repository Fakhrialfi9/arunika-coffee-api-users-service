import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSync } from '@grpc/proto-loader';
import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));
const protoPath = resolve(currentDir, '../../proto/users/v1/users.proto');

const loadContract = () =>
  loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

describe('Users gRPC contract', () => {
  it('loads the canonical v1 protobuf contract', () => {
    expect(existsSync(protoPath)).toBe(true);

    const packageDefinition = loadContract();
    const service = packageDefinition['arunika.coffee.users.v1.UsersService'];

    expect(service).toBeDefined();
    expect(service?.service).toBeDefined();

    const methods = Object.keys(service?.service ?? {});

    expect(methods).toHaveLength(5);
    expect(methods).toEqual(
      expect.arrayContaining([
        'CreateUser',
        'GetUser',
        'ListUsers',
        'UpdateUser',
        'DeleteUser',
      ]),
    );
  });

  it('defines all CRUD request and response messages', () => {
    const packageDefinition = loadContract();

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
