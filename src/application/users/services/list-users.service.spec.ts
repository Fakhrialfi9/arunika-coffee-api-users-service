import 'reflect-metadata';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from 'vitest';

import { User } from '../../../domain/users/entities/user.entity.js';
import type {
  UserListResult,
  UserRepository,
} from '../../../domain/users/repositories/user.repository.js';
import { ListUsersDto } from '../dto/list-users.dto.js';
import { ListUsersValidationError } from '../errors/list-users-validation.error.js';
import { ListUsersService } from './list-users.service.js';

const createUser = (
  overrides: Partial<Parameters<typeof User.create>[0]> = {},
) =>
  User.create({
    username: 'fakhri',
    email: 'fakhri@example.com',
    phone: '+628123456789',
    status: 'active',
    ...overrides,
  });

describe('ListUsersService', () => {
  let repository: UserRepository;
  let service: ListUsersService;
  let listMock: MockedFunction<UserRepository['list']>;

  beforeEach(() => {
    listMock = vi.fn();
    repository = {
      findByUuid: vi.fn(),
      existsByUsername: vi.fn(),
      existsByEmail: vi.fn(),
      existsByPhone: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: listMock,
    };
    service = new ListUsersService(repository);
  });

  it('lists users with default pagination and deterministic sorting options', async () => {
    const users = [createUser(), createUser({ username: 'alfi' })];
    const result: UserListResult = {
      items: users,
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    };
    listMock.mockResolvedValue(result);

    const response = await service.execute(new ListUsersDto());

    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(response.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    expect(response.items).toHaveLength(2);
  });

  it('passes filters, search, pagination, and sorting to the repository', async () => {
    listMock.mockResolvedValue({
      items: [],
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
    });

    await service.execute({
      page: 2,
      limit: 10,
      search: '  fakhri  ',
      username: '  fakhri  ',
      email: 'fakhri@example.com',
      phone: '+628123456789',
      status: 'active',
      isActive: true,
      isVerified: false,
      sortBy: 'username',
      sortOrder: 'asc',
    });

    expect(listMock).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'fakhri',
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
      status: 'active',
      isActive: true,
      isVerified: false,
      sortBy: 'username',
      sortOrder: 'asc',
    });
  });

  it('transforms boolean query values correctly', async () => {
    listMock.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    await service.execute({
      isActive: 'false' as unknown as boolean,
      isVerified: 'true' as unknown as boolean,
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        isVerified: true,
      }),
    );
  });

  it('rejects invalid boolean query values', async () => {
    await expect(
      service.execute({ isActive: 'invalid' as unknown as boolean }),
    ).rejects.toBeInstanceOf(ListUsersValidationError);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('rejects invalid pagination and sorting input', async () => {
    await expect(
      service.execute({
        page: 0,
        limit: 101,
        sortBy: 'invalid' as 'createdAt',
        sortOrder: 'invalid' as 'desc',
      }),
    ).rejects.toBeInstanceOf(ListUsersValidationError);

    expect(listMock).not.toHaveBeenCalled();
  });

  it('rejects unknown properties', async () => {
    await expect(
      service.execute({ unexpected: true } as never),
    ).rejects.toBeInstanceOf(ListUsersValidationError);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('maps only safe user fields into the application response', async () => {
    const user = createUser();
    listMock.mockResolvedValue({
      items: [user],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const response = await service.execute(new ListUsersDto());

    expect(response.items[0]).toEqual({
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(response.items[0]).not.toHaveProperty('deletedAt');
  });
});
