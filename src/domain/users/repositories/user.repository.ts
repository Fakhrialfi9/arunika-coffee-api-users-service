import type { User } from '../entities/user.entity.js';

export interface UserRepository {
  findByUuid(uuid: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
