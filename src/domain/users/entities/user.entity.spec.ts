import { randomUUID } from 'node:crypto';

import { User } from './user.entity.js';

describe('User', () => {
  it('creates a user with safe defaults and a UUID identity', () => {
    const user = User.create();

    expect(user.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(user.status).toBe('pending');
    expect(user.isActive).toBe(true);
    expect(user.isVerified).toBe(false);
    expect(user.deletedAt).toBeNull();
  });

  it('reconstitutes a persisted user without Prisma dependencies', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const uuid = randomUUID();

    const user = User.reconstitute({
      uuid,
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
      status: 'active',
      isActive: true,
      isVerified: true,
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(user.uuid).toBe(uuid);
    expect(user.username).toBe('fakhri');
    expect(user.email).toBe('fakhri@example.com');
    expect(user.createdAt).toEqual(createdAt);
    expect(user.updatedAt).toEqual(updatedAt);
  });

  it('rejects an invalid UUID', () => {
    expect(() => User.create({ uuid: 'invalid-uuid' })).toThrow('valid UUID');
  });

  it('enforces database-aligned field lengths', () => {
    expect(() => User.create({ username: 'a'.repeat(101) })).toThrow(
      'username',
    );
    expect(() => User.create({ email: 'a'.repeat(192) })).toThrow('email');
    expect(() => User.create({ phone: 'a'.repeat(31) })).toThrow('phone');
    expect(() => User.create({ status: 'a'.repeat(31) })).toThrow('status');
  });

  it('soft deletes and prevents mutation of a deleted user', () => {
    const user = User.create({ uuid: randomUUID() });
    const deletedAt = new Date('2026-01-03T00:00:00.000Z');

    user.softDelete(deletedAt);

    expect(user.deletedAt).toEqual(deletedAt);
    expect(user.isActive).toBe(false);
    expect(() => user.activate()).toThrow('Deleted user');
    expect(() => user.verify()).toThrow('Deleted user');
  });

  it('restores a soft-deleted user', () => {
    const user = User.create();
    user.softDelete();

    user.restore();

    expect(user.deletedAt).toBeNull();
    expect(user.isActive).toBe(true);
  });
});
