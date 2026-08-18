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

    expect(proto).toContain('package arunika.coffee.users.v1;');
    expect(proto).toContain('service UsersService {');

    expect(proto).toMatch(/message User \{[\s\S]*string uuid = 1;[\s\S]*optional string username = 2;[\s\S]*optional string email = 3;[\s\S]*optional string phone = 4;[\s\S]*string status = 5;[\s\S]*bool is_active = 6;[\s\S]*bool is_verified = 7;[\s\S]*string created_at = 8;[\s\S]*string updated_at = 9;/);
    expect(proto).toMatch(/message ListUsersRequest \{[\s\S]*uint32 page = 1;[\s\S]*uint32 limit = 2;[\s\S]*optional string search = 3;[\s\S]*optional string username = 4;[\s\S]*optional string email = 5;[\s\S]*optional string phone = 6;[\s\S]*optional string status = 7;[\s\S]*optional bool is_active = 8;[\s\S]*optional bool is_verified = 9;[\s\S]*SortField sort_by = 10;[\s\S]*SortOrder sort_order = 11;/);
    expect(proto).toMatch(/enum SortField \{[\s\S]*SORT_FIELD_UNSPECIFIED = 0;[\s\S]*SORT_FIELD_CREATED_AT = 1;[\s\S]*SORT_FIELD_UPDATED_AT = 2;[\s\S]*SORT_FIELD_USERNAME = 3;[\s\S]*SORT_FIELD_EMAIL = 4;[\s\S]*SORT_FIELD_STATUS = 5;[\s\S]*SORT_FIELD_UUID = 6;/);
    expect(proto).toMatch(/enum SortOrder \{[\s\S]*SORT_ORDER_UNSPECIFIED = 0;[\s\S]*SORT_ORDER_ASC = 1;[\s\S]*SORT_ORDER_DESC = 2;/);
    expect(proto).toMatch(/message Pagination \{[\s\S]*uint32 page = 1;[\s\S]*uint32 limit = 2;[\s\S]*uint64 total = 3;[\s\S]*uint32 total_pages = 4;/);
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
