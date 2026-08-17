import { describe, expect, it } from 'vitest';

import { User } from './user.entity.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('User entity', () => {
  it('creates a user with a UUID and default state', () => {
    const user = User.create();

    expect(user.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(user.status).toBe('pending');
    expect(user.isActive).toBe(true);
    expect(user.isVerified).toBe(false);
    expect(user.deletedAt).toBeNull();
  });

  it('preserves a valid reconstituted user identity and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const user = User.reconstitute({
      uuid: UUID,
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

    expect(user.uuid).toBe(UUID);
    expect(user.createdAt).toEqual(createdAt);
    expect(user.updatedAt).toEqual(updatedAt);
  });

  it('updates mutable identity fields while preserving UUID and createdAt', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const user = User.reconstitute({
      uuid: UUID,
      username: 'fakhri',
      email: 'fakhri@example.com',
      phone: '+628123456789',
      createdAt,
      updatedAt: createdAt,
    });

    user.updateIdentity({
      username: 'alfi',
      email: 'alfi@example.com',
      phone: null,
    });

    expect(user.uuid).toBe(UUID);
    expect(user.createdAt).toEqual(createdAt);
    expect(user.username).toBe('alfi');
    expect(user.email).toBe('alfi@example.com');
    expect(user.phone).toBeNull();
    expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
  });

  it('does not allow mutable fields to be changed after soft deletion', () => {
    const user = User.create({ uuid: UUID });
    user.softDelete();

    expect(() => user.updateIdentity({ username: 'blocked' })).toThrow(
      'Deleted user cannot be modified',
    );
    expect(() => user.changeStatus('active')).toThrow(
      'Deleted user cannot be modified',
    );
  });

  it('activates, deactivates, verifies, and changes status through domain methods', () => {
    const user = User.create({ uuid: UUID });

    user.deactivate();
    user.verify();
    user.changeStatus('active');

    expect(user.isActive).toBe(false);
    expect(user.isVerified).toBe(true);
    expect(user.status).toBe('active');
  });

  it('rejects invalid UUIDs and invalid status values', () => {
    expect(() => User.create({ uuid: 'invalid' })).toThrow(
      'User uuid must be a valid UUID',
    );
    expect(() => User.create({ uuid: UUID, status: '   ' })).toThrow(
      'User status must contain between 1 and 30 characters',
    );
  });
});
