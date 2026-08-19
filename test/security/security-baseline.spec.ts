import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateUserDto } from '../../src/application/users/dto/create-user.dto.js';
import { UpdateUserDto } from '../../src/application/users/dto/update-user.dto.js';
import { UsersGrpcController } from '../../src/presentation/grpc/users-grpc.controller.js';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

const userWithSensitiveFields = {
  uuid: UUID,
  username: 'security-user',
  email: 'security@example.com',
  phone: '+628123456789',
  status: 'pending',
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-08-18T00:00:00.000Z'),
  updatedAt: new Date('2026-08-18T00:00:00.000Z'),

  // Sensitive credential/authentication fields.
  password_hash: '$argon2id$v=19$secret',
  passwordChangedAt: new Date('2026-08-18T00:00:00.000Z'),
  passwordExpiresAt: new Date('2027-08-18T00:00:00.000Z'),
  secretEncrypted: 'encrypted-2fa-secret',
  sessionId: 'sensitive-session-id',
  lastLoginIp: '127.0.0.1',
};

const expectNoSensitiveFields = (value: unknown): void => {
  expect(value).not.toHaveProperty('password_hash');
  expect(value).not.toHaveProperty('passwordHash');
  expect(value).not.toHaveProperty('passwordChangedAt');
  expect(value).not.toHaveProperty('passwordExpiresAt');
  expect(value).not.toHaveProperty('secretEncrypted');
  expect(value).not.toHaveProperty('sessionId');
  expect(value).not.toHaveProperty('lastLoginIp');
};

describe('Step 19 security baseline', () => {
  it('keeps credential and authentication fields out of Create/Get/List/Update gRPC responses', async () => {
    const controller = new UsersGrpcController(
      {
        execute: () => userWithSensitiveFields,
      } as never,
      {
        execute: () => userWithSensitiveFields,
      } as never,
      {
        execute: () => ({
          items: [userWithSensitiveFields],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        }),
      } as never,
      {
        execute: () => userWithSensitiveFields,
      } as never,
      {
        execute: () => undefined,
      } as never,
    );

    const created = await controller.createUserHandler({
      email: 'security@example.com',
    });

    const fetched = await controller.getUserHandler({
      uuid: UUID,
    });

    const listed = await controller.listUsersHandler({});

    const updated = await controller.updateUserHandler({
      uuid: UUID,
      status: 'active',
    });

    expectNoSensitiveFields(created.user);
    expectNoSensitiveFields(fetched.user);
    expectNoSensitiveFields(listed.items[0]);
    expectNoSensitiveFields(updated.user);
  });

  it('rejects credential fields injected into create/update payloads', async () => {
    const create = plainToInstance(CreateUserDto, {
      email: 'security@example.com',
      password_hash: 'attacker-controlled-hash',
    });

    const update = plainToInstance(UpdateUserDto, {
      status: 'active',
      password_hash: 'attacker-controlled-hash',
    });

    const createErrors = await validate(create, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const updateErrors = await validate(update, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(
      createErrors.some((error) => error.property === 'password_hash'),
    ).toBe(true);

    expect(
      updateErrors.some((error) => error.property === 'password_hash'),
    ).toBe(true);
  });

  it('normalizes identity input and rejects oversized or malformed values', async () => {
    const dto = plainToInstance(CreateUserDto, {
      username: '  security-user  ',
      email: ' SECURITY@EXAMPLE.COM ',
      phone: '  +628123456789  ',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.username).toBe('security-user');
    expect(dto.email).toBe('security@example.com');
    expect(dto.phone).toBe('+628123456789');

    const oversized = plainToInstance(CreateUserDto, {
      username: 'x'.repeat(101),
    });

    const malformed = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
    });

    expect(
      (
        await validate(oversized, {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).length,
    ).toBeGreaterThan(0);

    expect(
      (
        await validate(malformed, {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).length,
    ).toBeGreaterThan(0);
  });
});
