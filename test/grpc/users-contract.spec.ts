import { existsSync, readFileSync } from 'node:fs';
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

const readContract = () => readFileSync(protoPath, 'utf8');

describe('Users gRPC contract', () => {
  it('loads the canonical v1 protobuf contract', () => {
    expect(existsSync(protoPath)).toBe(true);

    const packageDefinition = loadContract();
    const service = packageDefinition['arunika.coffee.users.v1.UsersService'];

    expect(service).toBeDefined();
    expect(service?.service).toBeDefined();

    const serviceDefinition = service?.service as
      Record<string, unknown> | undefined;
    const methods = Object.keys(serviceDefinition ?? {});

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
      expect(
        packageDefinition[`arunika.coffee.users.v1.${name}`],
      ).toBeDefined();
    }
  });

  it('pins the version, field numbers, pagination, filtering, and sorting contract', () => {
    const proto = readContract();

    const contractLines = [
      'package arunika.coffee.users.v1;',
      'string uuid = 1;',
      'optional string username = 2;',
      'optional string email = 3;',
      'optional string phone = 4;',
      'string status = 5;',
      'bool is_active = 6;',
      'bool is_verified = 7;',
      'string created_at = 8;',
      'string updated_at = 9;',
      'uint32 page = 1;',
      'uint32 limit = 2;',
      'optional string search = 3;',
      'optional string username = 4;',
      'optional string email = 5;',
      'optional string phone = 6;',
      'optional string status = 7;',
      'optional bool is_active = 8;',
      'optional bool is_verified = 9;',
      'SortField sort_by = 10;',
      'SortOrder sort_order = 11;',
      'SORT_FIELD_UNSPECIFIED = 0;',
      'SORT_FIELD_CREATED_AT = 1;',
      'SORT_FIELD_UPDATED_AT = 2;',
      'SORT_FIELD_USERNAME = 3;',
      'SORT_FIELD_EMAIL = 4;',
      'SORT_FIELD_STATUS = 5;',
      'SORT_FIELD_UUID = 6;',
      'SORT_ORDER_UNSPECIFIED = 0;',
      'SORT_ORDER_ASC = 1;',
      'SORT_ORDER_DESC = 2;',
      'uint64 total = 3;',
      'uint32 total_pages = 4;',
    ];

    for (const line of contractLines) {
      expect(proto).toContain(line);
    }
  });

  it('keeps the CRUD contract explicit and reserves compatibility rules for v1', () => {
    const proto = readContract();

    expect(proto).toContain(
      'rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);',
    );
    expect(proto).toContain(
      'rpc GetUser(GetUserRequest) returns (GetUserResponse);',
    );
    expect(proto).toContain(
      'rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);',
    );
    expect(proto).toContain(
      'rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);',
    );
    expect(proto).toContain(
      'rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);',
    );
    expect(proto).toContain(
      'Do not reuse field numbers for different meanings. Reserve removed fields.',
    );
  });
});
