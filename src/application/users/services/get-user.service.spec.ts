import { randomUUID } from 'node:crypto';

import { GetUserService } from './get-user.service.js';
import { GetUserValidationError } from '../errors/get-user-validation.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type { UserRepository } from '../../../domain/users/repositories/user.repository.js';

class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  findByUuid(uuid: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find(
        (user) => user.uuid === uuid && user.deletedAt === null,
      ) ?? null,
    );
  }

  existsByUsername(username: string): Promise<boolean> {
    return Promise.resolve(
      this.users.some(
        (user) => user.username === username && user.deletedAt === null,
      ),
    );
  }

  existsByEmail(email: string): Promise<boolean> {
    return Promise.resolve(
      this.users.some(
        (user) => user.email === email && user.deletedAt === null,
      ),
    );
  }

  existsByPhone(phone: string): Promise<boolean> {
    return Promise.resolve(
      this.users.some(
        (user) => user.phone === phone && user.deletedAt === null,
      ),
    );
  }

  create(user: User): Promise<User> {
    this.users.push(user);
    return Promise.resolve(user);
  }

  update(user: User): Promise<User> {
    const index = this.users.findIndex((item) => item.uuid === user.uuid);
    this.users[index] = user;
    return Promise.resolve(user);
  }
}

describe('GetUserService', () => {
  it('returns a user by UUID without exposing internal or deleted fields', async () => {
    const repository = new InMemoryUserRepository();
    const service = new GetUserService(repository);
    const user = User.create({
      uuid: randomUUID(),
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
    });
    await repository.create(user);

    const result = await service.execute({ uuid: user.uuid });

    expect(result).toEqual({
      uuid: user.uuid,
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
      status: 'pending',
      isActive: true,
      isVerified: false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('deletedAt');
  });

  it('throws UserNotFoundError when the UUID does not exist', async () => {
    const service = new GetUserService(new InMemoryUserRepository());
    const uuid = randomUUID();

    await expect(service.execute({ uuid })).rejects.toEqual(
      new UserNotFoundError(uuid),
    );
  });

  it('does not return a soft-deleted user', async () => {
    const repository = new InMemoryUserRepository();
    const service = new GetUserService(repository);
    const user = User.create({ uuid: randomUUID(), username: 'deleted' });
    user.softDelete();
    await repository.create(user);

    await expect(service.execute({ uuid: user.uuid })).rejects.toEqual(
      new UserNotFoundError(user.uuid),
    );
  });

  it('rejects an invalid UUID', async () => {
    const service = new GetUserService(new InMemoryUserRepository());

    await expect(
      service.execute({ uuid: 'invalid-uuid' }),
    ).rejects.toBeInstanceOf(GetUserValidationError);
  });

  it('rejects unexpected properties', async () => {
    const service = new GetUserService(new InMemoryUserRepository());

    await expect(
      service.execute({ uuid: randomUUID(), id: 1 } as unknown as {
        uuid: string;
      }),
    ).rejects.toBeInstanceOf(GetUserValidationError);
  });
});
