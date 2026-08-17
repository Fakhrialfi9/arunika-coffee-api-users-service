import { randomUUID } from 'node:crypto';

import { CreateUserService } from './create-user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { CreateUserValidationError } from '../errors/create-user-validation.error.js';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type { UserRepository } from '../../../domain/users/repositories/user.repository.js';

class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  findByUuid(uuid: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.uuid === uuid) ?? null,
    );
  }

  existsByUsername(username: string): Promise<boolean> {
    return Promise.resolve(
      this.users.some((user) => user.username === username),
    );
  }

  existsByEmail(email: string): Promise<boolean> {
    return Promise.resolve(this.users.some((user) => user.email === email));
  }

  existsByPhone(phone: string): Promise<boolean> {
    return Promise.resolve(this.users.some((user) => user.phone === phone));
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

describe('CreateUserService', () => {
  it('creates a user with generated UUID and safe defaults', async () => {
    const service = new CreateUserService(new InMemoryUserRepository());

    const result = await service.execute({
      username: 'fakhri',
      email: 'FAKHRI@example.com',
      phone: '+628123456789',
    });

    expect(result.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.username).toBe('fakhri');
    expect(result.email).toBe('fakhri@example.com');
    expect(result.phone).toBe('+628123456789');
    expect(result.status).toBe('pending');
    expect(result.isActive).toBe(true);
    expect(result.isVerified).toBe(false);
  });

  it('rejects an empty identity payload', async () => {
    const service = new CreateUserService(new InMemoryUserRepository());

    await expect(service.execute(new CreateUserDto())).rejects.toMatchObject({
      name: CreateUserValidationError.name,
      messages: ['At least one of username, email, or phone is required'],
    });
  });

  it('rejects malformed email input', async () => {
    const service = new CreateUserService(new InMemoryUserRepository());

    await expect(
      service.execute({ email: 'not-an-email' }),
    ).rejects.toBeInstanceOf(CreateUserValidationError);
  });

  it('rejects duplicate username, email, and phone', async () => {
    const repository = new InMemoryUserRepository();
    const service = new CreateUserService(repository);

    await service.execute({
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
    });

    await expect(service.execute({ username: 'fakhri' })).rejects.toEqual(
      new UserAlreadyExistsError('username'),
    );
    await expect(
      service.execute({ email: 'fakhri@example.com' }),
    ).rejects.toEqual(new UserAlreadyExistsError('email'));
    await expect(service.execute({ phone: '+628123456789' })).rejects.toEqual(
      new UserAlreadyExistsError('phone'),
    );
  });

  it('does not expose the internal database identifier', async () => {
    const repository = new InMemoryUserRepository();
    const service = new CreateUserService(repository);
    const user = User.create({ uuid: randomUUID(), username: 'safe' });
    await repository.create(user);

    const result = await service.execute({ username: 'public' });

    expect(result).not.toHaveProperty('id');
  });
});
