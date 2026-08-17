import { beforeEach, describe, expect, it, vi } from 'vitest';

import { User } from '../../../domain/users/entities/user.entity.js';
import type {
  UserListFilters,
  UserListResult,
  UserRepository,
} from '../../../domain/users/repositories/user.repository.js';
import { ListUsersDto } from '../dto/list-users.dto.js';
import { ListUsersValidationError } from '../errors/list-users-validation.error.js';
import { ListUsersService } from './list-users.service.js';

const createUser = (overrides: Partial<Parameters<typeof User.create>[0]> = {}) =>
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

  beforeEach(() => {
    repository = {
      findByUuid: vi.fn(),
      existsByUsername: vi.fn(),
      existsByEmail: vi.fn(),
      existsByPhone: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
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
    vi.mocked(repository.list).mockResolvedValue(result);

    const response = await service.execute(new ListUsersDto());

    expect(repository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      username: undefined,
      email: undefined,
      phone: undefined,
      status: undefined,
      isActive: undefined,
      isVerified: undefined,
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
    vi.mocked(repository.list).mockResolvedValue({
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

    expect(repository.list).toHaveBeenCalledWith({
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
    vi.mocked(repository.list).mockResolvedValue({
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

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        isVerified: true,
      }),
    );
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

    expect(repository.list).not.toHaveBeenCalled();
  });

  it('maps only safe user fields into the application response', async () => {
    const user = createUser();
    vi.mocked(repository.list).mockResolvedValue({
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
