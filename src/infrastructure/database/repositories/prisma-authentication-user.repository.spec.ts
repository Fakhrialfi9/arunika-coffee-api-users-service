import { randomUUID } from 'node:crypto';

import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type { UserRepository } from '../../../domain/users/repositories/user.repository.js';
import {
  RepositoryNotFoundError,
  RepositoryPersistenceError,
  RepositoryUniqueConstraintError,
} from '../errors/repository.error.js';
import { PrismaAuthenticationUserRepository } from './prisma-authentication-user.repository.js';
import type { PrismaService } from '../prisma.service.js';
import type { PrismaTransactionService } from '../prisma-transaction.service.js';

type AuthenticationUserRecord = {
  uuid: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const UUID = randomUUID();

const record: AuthenticationUserRecord = {
  uuid: UUID,
  username: 'fakhri',
  email: 'fakhri@example.com',
  phone: '+628123456789',
  status: 'pending',
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-08-18T00:00:00.000Z'),
  updatedAt: new Date('2026-08-18T00:00:00.000Z'),
  deletedAt: null,
};

function createRepository(options?: {
  findFirst?: (args: unknown) => Promise<unknown>;
  transactionResult?: AuthenticationUserRecord;
  transactionError?: unknown;
}): PrismaAuthenticationUserRepository {
  const prisma = {
    authenticationUser: {
      findFirst:
        options?.findFirst ?? (() => Promise.resolve(record)),
    },
  } as unknown as PrismaService;

  const transactionClient = {
    authenticationUser: {
      create: () => {
        if (options?.transactionError !== undefined) {
          return Promise.reject(options.transactionError);
        }
        return Promise.resolve(options?.transactionResult ?? record);
      },
      update: () => {
        if (options?.transactionError !== undefined) {
          return Promise.reject(options.transactionError);
        }
        return Promise.resolve(options?.transactionResult ?? record);
      },
      findMany: () => Promise.resolve([record]),
      count: () => Promise.resolve(1),
    },
  } as unknown as Prisma.TransactionClient;

  const transactions = {
    run: async <T>(
      operation: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => operation(transactionClient),
  } as unknown as PrismaTransactionService;

  return new PrismaAuthenticationUserRepository(prisma, transactions);
}

describe('PrismaAuthenticationUserRepository', () => {
  it('maps a persisted record into the domain entity without exposing the database id', async () => {
    const repository: UserRepository = createRepository();

    const user = await repository.findByUuid(UUID);

    expect(user).toBeInstanceOf(User);
    expect(user?.uuid).toBe(UUID);
    expect(user).not.toHaveProperty('id');
  });

  it('maps Prisma unique violations to RepositoryUniqueConstraintError', async () => {
    const prismaError = {
      code: 'P2002',
      meta: { target: ['email'] },
    };
    const repository = createRepository({ transactionError: prismaError });
    const user = User.create({ uuid: randomUUID(), email: 'duplicate@example.com' });

    await expect(repository.create(user)).rejects.toMatchObject({
      code: 'REPOSITORY_UNIQUE_CONSTRAINT',
      field: 'email',
    });
    await expect(repository.create(user)).rejects.toBeInstanceOf(
      RepositoryUniqueConstraintError,
    );
  });

  it('maps Prisma not-found violations to RepositoryNotFoundError', async () => {
    const repository = createRepository({
      transactionError: { code: 'P2025' },
    });
    const user = User.create({ uuid: randomUUID(), username: 'missing' });

    await expect(repository.update(user)).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
  });

  it('maps unexpected persistence failures to RepositoryPersistenceError', async () => {
    const repository = createRepository({
      transactionError: new Error('database connection failed'),
    });
    const user = User.create({ uuid: randomUUID(), username: 'failure' });

    await expect(repository.create(user)).rejects.toBeInstanceOf(
      RepositoryPersistenceError,
    );
  });

  it('maps list records and pagination metadata', async () => {
    const repository = createRepository();

    const result = await repository.list({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.uuid).toBe(UUID);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
