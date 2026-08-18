import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { User } from '../../src/domain/users/entities/user.entity.js';
import { RepositoryUniqueConstraintError } from '../../src/infrastructure/database/errors/repository.error.js';
import { PrismaTransactionService } from '../../src/infrastructure/database/prisma-transaction.service.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { PrismaAuthenticationUserRepository } from '../../src/infrastructure/database/repositories/prisma-authentication-user.repository.js';

describe('Users CRUD repository integration', () => {
  let prisma: PrismaService | undefined;
  let repository: PrismaAuthenticationUserRepository | undefined;
  const uuids: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new PrismaAuthenticationUserRepository(
      prisma,
      new PrismaTransactionService(prisma),
    );
  });

  afterAll(async () => {
    if (prisma === undefined) return;

    if (uuids.length > 0) {
      await prisma.authenticationUser.deleteMany({
        where: { uuid: { in: uuids } },
      });
    }
    await prisma.onModuleDestroy();
  });

  it('creates and reads a user by UUID', async () => {
    const uuid = randomUUID();
    uuids.push(uuid);
    const user = User.create({
      uuid,
      username: `crud-${uuid.slice(0, 8)}`,
      email: `crud-${uuid}@example.com`,
      phone: '+628123456789',
    });

    const created = await repository!.create(user);
    const found = await repository!.findByUuid(uuid);

    expect(created.uuid).toBe(uuid);
    expect(found?.uuid).toBe(uuid);
    expect(found?.email).toBe(user.email);
    expect(found?.phone).toBe(user.phone);
  });

  it('maps database uniqueness violations to a repository error', async () => {
    const firstUuid = randomUUID();
    const secondUuid = randomUUID();
    uuids.push(firstUuid, secondUuid);
    const email = `duplicate-${firstUuid}@example.com`;

    await repository!.create(
      User.create({
        uuid: firstUuid,
        username: `duplicate-${firstUuid.slice(0, 8)}`,
        email,
      }),
    );

    await expect(
      repository!.create(
        User.create({
          uuid: secondUuid,
          username: `duplicate-${secondUuid.slice(0, 8)}`,
          email,
        }),
      ),
    ).rejects.toBeInstanceOf(RepositoryUniqueConstraintError);
  });

  it('updates identity and state, then persists the change', async () => {
    const uuid = randomUUID();
    uuids.push(uuid);
    const user = User.create({
      uuid,
      username: `before-${uuid.slice(0, 8)}`,
      email: `before-${uuid}@example.com`,
    });

    await repository!.create(user);
    user.updateIdentity({
      username: `after-${uuid.slice(0, 8)}`,
      email: `after-${uuid}@example.com`,
    });
    user.verify();
    user.changeStatus('active');

    const updated = await repository!.update(user);
    const found = await repository!.findByUuid(uuid);

    expect(updated.username).toBe(`after-${uuid.slice(0, 8)}`);
    expect(updated.isVerified).toBe(true);
    expect(updated.status).toBe('active');
    expect(found?.username).toBe(updated.username);
    expect(found?.isVerified).toBe(true);
    expect(found?.status).toBe('active');
  });

  it('lists users with filters and deterministic pagination metadata', async () => {
    const uuid = randomUUID();
    uuids.push(uuid);
    const username = `list-${uuid.slice(0, 8)}`;

    await repository!.create(
      User.create({
        uuid,
        username,
        email: `list-${uuid}@example.com`,
        status: 'active',
      }),
    );

    const result = await repository!.list({
      page: 1,
      limit: 10,
      search: username,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.items.some((item) => item.uuid === uuid)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('soft-deletes a user and excludes it from normal reads', async () => {
    const uuid = randomUUID();
    uuids.push(uuid);
    const user = User.create({
      uuid,
      username: `delete-${uuid.slice(0, 8)}`,
      email: `delete-${uuid}@example.com`,
    });

    await repository!.create(user);
    user.softDelete();
    await repository!.update(user);

    expect(await repository!.findByUuid(uuid)).toBeNull();
    const result = await repository!.list({
      page: 1,
      limit: 10,
      search: user.username ?? undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.items.some((item) => item.uuid === uuid)).toBe(false);
  });
});
