import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { CreateUserDto } from '../../src/application/users/dto/create-user.dto.js';
import { UpdateUserDto } from '../../src/application/users/dto/update-user.dto.js';
import { UsersGrpcController } from '../../src/presentation/grpc/users-grpc.controller.js';

describe('Security baseline', () => {
  it('exposes only the public user fields and never credential fields', async () => {
    const controller = new UsersGrpcController(
      { execute: vi.fn() } as never,
      {
        execute: vi.fn().mockResolvedValue({
          uuid: '00000000-0000-4000-8000-000000000001',
          username: 'safe-user',
          email: 'safe@example.com',
          phone: '+628123456789',
          status: 'pending',
          isActive: true,
          isVerified: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          passwordHash: 'must-never-escape',
          secretEncrypted: 'must-never-escape',
        }),
      } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    const response = await controller.getUserHandler({
      uuid: '00000000-0000-4000-8000-000000000001',
    });
    const user = response.user as unknown as Record<string, unknown>;

    expect(Object.keys(user).sort()).toEqual([
      'created_at',
      'email',
      'is_active',
      'is_verified',
      'phone',
      'status',
      'updated_at',
      'username',
      'uuid',
    ]);
    expect(user).not.toHaveProperty('password_hash');
    expect(user).not.toHaveProperty('passwordHash');
    expect(user).not.toHaveProperty('secret_encrypted');
    expect(user).not.toHaveProperty('secretEncrypted');
  });

  it('trims and normalizes user input before validation', async () => {
    const dto = plainToInstance(CreateUserDto, {
      username: '  safe-user  ',
      email: ' SAFE@EXAMPLE.COM ',
      phone: '  +628123456789  ',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.username).toBe('safe-user');
    expect(dto.email).toBe('safe@example.com');
    expect(dto.phone).toBe('+628123456789');
  });

  it('rejects oversized user-controlled string fields', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      username: 'a'.repeat(101),
      email: 'safe@example.com',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((error) => error.property === 'username')).toBe(true);
  });
});
