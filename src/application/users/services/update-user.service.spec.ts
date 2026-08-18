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
import type { UserRepository } from '../../../domain/users/repositories/user.repository.js';
import { RepositoryUniqueConstraintError } from '../../../infrastructure/database/errors/repository.error.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UpdateUserValidationError } from '../errors/update-user-validation.error.js';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';
import { UpdateUserService } from './update-user.service.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const createUser = (
  overrides: Partial<Parameters<typeof User.create>[0]> = {},
) =>
  User.create({
    uuid: UUID,
    username: 'fakhri',
    email: 'fakhri@example.com',
    phone: '+628123456789',
    status: 'pending',
    ...overrides,
  });

describe('UpdateUserService', () => {
  let repository: UserRepository;
  let service: UpdateUserService;
  let findByUuidMock: MockedFunction<UserRepository['findByUuid']>;
  let existsByUsernameMock: MockedFunction<UserRepository['existsByUsername']>;
  let existsByEmailMock: MockedFunction<UserRepository['existsByEmail']>;
  let existsByPhoneMock: MockedFunction<UserRepository['existsByPhone']>;
  let updateMock: MockedFunction<UserRepository['update']>;

  beforeEach(() => {
    findByUuidMock = vi.fn();
    existsByUsernameMock = vi.fn().mockResolvedValue(false);
    existsByEmailMock = vi.fn().mockResolvedValue(false);
    existsByPhoneMock = vi.fn().mockResolvedValue(false);
    updateMock = vi.fn();

    repository = {
      findByUuid: findByUuidMock,
      existsByUsername: existsByUsernameMock,
      existsByEmail: existsByEmailMock,
      existsByPhone: existsByPhoneMock,
      create: vi.fn(),
      update: updateMock,
      list: vi.fn(),
    };

    service = new UpdateUserService(repository);
  });

  it('updates only supplied fields and preserves immutable identity fields', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    const result = await service.execute(UUID, {
      email: 'new@example.com',
      status: 'active',
    });

    expect(result.uuid).toBe(UUID);
    expect(result.username).toBe('fakhri');
    expect(result.email).toBe('new@example.com');
    expect(result.phone).toBe('+628123456789');
    expect(result.status).toBe('active');
    expect(updateMock).toHaveBeenCalledWith(user);
  });

  it('normalizes email and string fields before applying the update', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    await service.execute(UUID, {
      username: '  alfi  ',
      email: '  ALFI@EXAMPLE.COM  ',
      phone: '  +628111111111  ',
    });

    expect(user.username).toBe('alfi');
    expect(user.email).toBe('alfi@example.com');
    expect(user.phone).toBe('+628111111111');
  });

  it('allows nullable identity fields to be cleared', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    const result = await service.execute(UUID, {
      username: null,
      phone: null,
    });

    expect(result.username).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBe('fakhri@example.com');
  });

  it('rejects an empty partial update', async () => {
    await expect(
      service.execute(UUID, new UpdateUserDto()),
    ).rejects.toBeInstanceOf(UpdateUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only string values', async () => {
    await expect(
      service.execute(UUID, { status: '   ' }),
    ).rejects.toBeInstanceOf(UpdateUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
  });

  it('rejects malformed email input', async () => {
    await expect(
      service.execute(UUID, { email: 'not-an-email' }),
    ).rejects.toBeInstanceOf(UpdateUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
  });

  it('rejects unknown properties', async () => {
    await expect(
      service.execute(UUID, {
        email: 'new@example.com',
        unexpected: true,
      } as never),
    ).rejects.toBeInstanceOf(UpdateUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID before accessing the repository', async () => {
    await expect(
      service.execute('invalid-uuid', { email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(UpdateUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
  });

  it('rejects updates for a missing user', async () => {
    findByUuidMock.mockResolvedValue(null);

    await expect(
      service.execute(UUID, { email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('detects username conflicts while excluding the current user', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    existsByUsernameMock.mockResolvedValue(true);

    await expect(
      service.execute(UUID, { username: 'other-user' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    expect(existsByUsernameMock).toHaveBeenCalledWith('other-user', UUID);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('maps a repository unique constraint into a safe application error', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockRejectedValue(new RepositoryUniqueConstraintError('email'));

    await expect(
      service.execute(UUID, { email: 'race@example.com' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('updates active and verified state through domain behavior', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    const result = await service.execute(UUID, {
      isActive: false,
      isVerified: true,
    });

    expect(result.isActive).toBe(false);
    expect(result.isVerified).toBe(true);
  });
});
