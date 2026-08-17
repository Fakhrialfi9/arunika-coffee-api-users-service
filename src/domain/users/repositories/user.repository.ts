import type { User } from '../entities/user.entity.js';

export type UserUniqueField = 'username' | 'email' | 'phone';

export interface UserUniqueFields {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByUuid(uuid: string): Promise<User | null>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
