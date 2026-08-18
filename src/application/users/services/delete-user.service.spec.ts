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
import { DeleteUserValidationError } from '../errors/delete-user-validation.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';
import { DeleteUserService } from './delete-user.service.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const createUser = () =>
  User.create({
    uuid: UUID,
    username: 'fakhri',
    email: 'fakhri@example.com',
    phone: '+628123456789',
    status: 'active',
  });

describe('DeleteUserService', () => {
  let repository: UserRepository;
  let service: DeleteUserService;
  let findByUuidMock: MockedFunction<UserRepository['findByUuid']>;
  let updateMock: MockedFunction<UserRepository['update']>;

  beforeEach(() => {
    findByUuidMock = vi.fn();
    updateMock = vi.fn();

    repository = {
      findByUuid: findByUuidMock,
      existsByUsername: vi.fn(),
      existsByEmail: vi.fn(),
      existsByPhone: vi.fn(),
      create: vi.fn(),
      update: updateMock,
      list: vi.fn(),
    };

    service = new DeleteUserService(repository);
  });

  it('soft deletes the user without removing the domain entity', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    await service.execute({ uuid: UUID });

    expect(user.deletedAt).not.toBeNull();
    expect(user.isActive).toBe(false);
    expect(updateMock).toHaveBeenCalledWith(user);
  });

  it('rejects an invalid UUID before accessing the repository', async () => {
    await expect(
      service.execute({ uuid: 'invalid-uuid' }),
    ).rejects.toBeInstanceOf(DeleteUserValidationError);
    expect(findByUuidMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects deletion when the user does not exist', async () => {
    findByUuidMock.mockResolvedValue(null);

    await expect(service.execute({ uuid: UUID })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('does not attempt a physical delete', async () => {
    const user = createUser();
    findByUuidMock.mockResolvedValue(user);
    updateMock.mockImplementation((updated) => Promise.resolve(updated));

    await service.execute({ uuid: UUID });

    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
