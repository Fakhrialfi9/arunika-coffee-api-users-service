import type { User } from '../entities/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserListSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'username'
  | 'email'
  | 'status'
  | 'uuid';

export type UserListSortOrder = 'asc' | 'desc';

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  sortBy: UserListSortField;
  sortOrder: UserListSortOrder;
}

export interface UserListResult {
  items: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserRepository {
  findByUuid(uuid: string): Promise<User | null>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  list(filters: UserListFilters): Promise<UserListResult>;
}
