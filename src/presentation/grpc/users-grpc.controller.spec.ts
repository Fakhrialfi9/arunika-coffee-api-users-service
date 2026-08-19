import { status } from '@grpc/grpc-js';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateUserService } from '../../application/users/services/create-user.service.js';
import { DeleteUserService } from '../../application/users/services/delete-user.service.js';
import { GetUserService } from '../../application/users/services/get-user.service.js';
import { ListUsersService } from '../../application/users/services/list-users.service.js';
import { UpdateUserService } from '../../application/users/services/update-user.service.js';
import { UsersGrpcController } from './users-grpc.controller.js';

const user = {
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  username: 'fakhri',
  email: 'fakhri@example.com',
  phone: '+628123456789',
  status: 'pending',
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-08-18T00:00:00.000Z'),
  updatedAt: new Date('2026-08-18T00:00:00.000Z'),
};

const getGrpcErrorCode = (error: unknown): number | undefined => {
  if (!(error instanceof Error) || !('error' in error)) {
    return undefined;
  }

  const rpcError = error.error;
  return typeof rpcError === 'object' && rpcError !== null && 'code' in rpcError
    ? Number(rpcError.code)
    : undefined;
};

describe('UsersGrpcController', () => {
  let controller: UsersGrpcController;
  let createUser: { execute: ReturnType<typeof vi.fn> };
  let getUser: { execute: ReturnType<typeof vi.fn> };
  let listUsers: { execute: ReturnType<typeof vi.fn> };
  let updateUser: { execute: ReturnType<typeof vi.fn> };
  let deleteUser: { execute: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    createUser = { execute: vi.fn().mockResolvedValue(user) };
    getUser = { execute: vi.fn().mockResolvedValue(user) };
    listUsers = {
      execute: vi.fn().mockResolvedValue({
        items: [user],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    updateUser = { execute: vi.fn().mockResolvedValue(user) };
    deleteUser = { execute: vi.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      controllers: [UsersGrpcController],
      providers: [
        { provide: CreateUserService, useValue: createUser },
        { provide: GetUserService, useValue: getUser },
        { provide: ListUsersService, useValue: listUsers },
        { provide: UpdateUserService, useValue: updateUser },
        { provide: DeleteUserService, useValue: deleteUser },
      ],
    }).compile();

    controller = module.get(UsersGrpcController);
  });

  it('handles CreateUser', async () => {
    const result = await controller.createUserHandler({
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
    });

    expect(createUser.execute).toHaveBeenCalledWith({
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
    });
    expect(result.user.uuid).toBe(user.uuid);
    expect(result.user.is_active).toBe(true);
  });

  it('omits absent optional CreateUser fields', async () => {
    await controller.createUserHandler({ email: 'fakhri@example.com' });

    expect(createUser.execute).toHaveBeenCalledWith({
      email: 'fakhri@example.com',
    });
  });

  it('handles GetUser', async () => {
    const result = await controller.getUserHandler({ uuid: user.uuid });

    expect(getUser.execute).toHaveBeenCalledWith({ uuid: user.uuid });
    expect(result.user.email).toBe(user.email);
  });

  it('handles ListUsers and maps protobuf pagination fields', async () => {
    const result = await controller.listUsersHandler({
      page: 2,
      limit: 10,
      search: 'fakhri',
      sort_by: 'SORT_FIELD_EMAIL',
      sort_order: 'SORT_ORDER_ASC',
    });

    expect(listUsers.execute).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'fakhri',
      sortBy: 'email',
      sortOrder: 'asc',
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });
  });

  it('maps protobuf scalar and enum defaults to application defaults', async () => {
    await controller.listUsersHandler({
      page: 0,
      limit: 0,
      sort_by: 'SORT_FIELD_UNSPECIFIED',
      sort_order: 'SORT_ORDER_UNSPECIFIED',
    });

    expect(listUsers.execute).toHaveBeenCalledWith({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('rejects malformed pagination as INVALID_ARGUMENT', async () => {
    await expect(
      controller.listUsersHandler({
        page: 1.5,
        sort_by: 'SORT_FIELD_CREATED_AT',
      }),
    ).rejects.toSatisfy((error: unknown) =>
      expect(getGrpcErrorCode(error)).toBe(status.INVALID_ARGUMENT),
    );
  });

  it('rejects unsupported protobuf enums as INVALID_ARGUMENT', async () => {
    await expect(
      controller.listUsersHandler({ sort_by: 'INVALID_SORT_FIELD' }),
    ).rejects.toSatisfy((error: unknown) =>
      expect(getGrpcErrorCode(error)).toBe(status.INVALID_ARGUMENT),
    );

    await expect(
      controller.listUsersHandler({ sort_order: 'INVALID_SORT_ORDER' }),
    ).rejects.toSatisfy((error: unknown) =>
      expect(getGrpcErrorCode(error)).toBe(status.INVALID_ARGUMENT),
    );
  });

  it('handles UpdateUser without forwarding absent optional fields', async () => {
    const result = await controller.updateUserHandler({
      uuid: user.uuid,
      email: 'updated@example.com',
      is_active: false,
    });

    expect(updateUser.execute).toHaveBeenCalledWith(user.uuid, {
      email: 'updated@example.com',
      isActive: false,
    });
    expect(result.user.uuid).toBe(user.uuid);
  });

  it('handles DeleteUser', async () => {
    const result = await controller.deleteUserHandler({ uuid: user.uuid });

    expect(deleteUser.execute).toHaveBeenCalledWith({ uuid: user.uuid });
    expect(result).toEqual({ uuid: user.uuid, deleted: true });
  });
});
