import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type {
  UserListFilters,
  UserListResult,
  UserRepository,
} from '../../../domain/users/repositories/user.repository.js';
import {
  RepositoryNotFoundError,
  RepositoryPersistenceError,
  RepositoryUniqueConstraintError,
  type UserUniqueField,
} from '../errors/repository.error.js';
import { PrismaTransactionService } from '../prisma-transaction.service.js';
import { PrismaService } from '../prisma.service.js';

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

@Injectable()
export class PrismaAuthenticationUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: PrismaTransactionService,
  ) {}

  async findByUuid(uuid: string): Promise<User | null> {
    const record = await this.prisma.authenticationUser.findFirst({
      where: { uuid, deletedAt: null },
    });
    return record === null ? null : this.toDomain(record);
  }

  async existsByUsername(username: string, excludeUuid?: string): Promise<boolean> {
    return this.exists({ username, ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }) });
  }

  async existsByEmail(email: string, excludeUuid?: string): Promise<boolean> {
    return this.exists({ email, ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }) });
  }

  async existsByPhone(phone: string, excludeUuid?: string): Promise<boolean> {
    return this.exists({ phone, ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }) });
  }

  async create(user: User): Promise<User> {
    try {
      const record = await this.transactions.run((transaction) =>
        transaction.authenticationUser.create({ data: this.toCreateInput(user) }),
      );
      return this.toDomain(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async update(user: User): Promise<User> {
    try {
      const record = await this.transactions.run((transaction) =>
        transaction.authenticationUser.update({
          where: { uuid: user.uuid },
          data: this.toUpdateInput(user),
        }),
      );
      return this.toDomain(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async list(filters: UserListFilters): Promise<UserListResult> {
    try {
      const where = this.toListWhere(filters);
      const skip = (filters.page - 1) * filters.limit;
      const orderBy = [
        { [filters.sortBy]: filters.sortOrder },
        { uuid: 'asc' },
      ] as Prisma.AuthenticationUserOrderByWithRelationInput[];
      const result = await this.transactions.run(async (transaction) => {
        const [records, total] = await Promise.all([
          transaction.authenticationUser.findMany({ where, skip, take: filters.limit, orderBy }),
          transaction.authenticationUser.count({ where }),
        ]);
        return { records, total };
      });
      return {
        items: result.records.map((record) => this.toDomain(record)),
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      };
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  private async exists(where: Prisma.AuthenticationUserWhereInput): Promise<boolean> {
    try {
      const record = await this.prisma.authenticationUser.findFirst({ where, select: { id: true } });
      return record !== null;
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  private mapPersistenceError(error: unknown): Error {
    if (error instanceof RepositoryPersistenceError || error instanceof RepositoryNotFoundError || error instanceof RepositoryUniqueConstraintError) return error;
    const code = this.prismaErrorCode(error);
    if (code === 'P2002') return new RepositoryUniqueConstraintError(this.resolveConflictField(this.prismaErrorTarget(error)), error);
    if (code === 'P2025') return new RepositoryNotFoundError(error);
    return new RepositoryPersistenceError(error);
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  }

  private prismaErrorTarget(error: unknown): unknown {
    return typeof error === 'object' && error !== null && 'meta' in error && typeof error.meta === 'object' && error.meta !== null && 'target' in error.meta ? error.meta.target : undefined;
  }

  private resolveConflictField(target: unknown): UserUniqueField {
    const fields = Array.isArray(target) ? target.map(String) : [String(target)];
    if (fields.includes('email')) return 'email';
    if (fields.includes('phone')) return 'phone';
    return 'username';
  }

  private toListWhere(filters: UserListFilters): Prisma.AuthenticationUserWhereInput {
    const where: Prisma.AuthenticationUserWhereInput = { deletedAt: null };
    if (filters.search !== undefined) where.OR = [{ username: { contains: filters.search } }, { email: { contains: filters.search } }, { phone: { contains: filters.search } }];
    if (filters.username !== undefined) where.username = filters.username;
    if (filters.email !== undefined) where.email = filters.email;
    if (filters.phone !== undefined) where.phone = filters.phone;
    if (filters.status !== undefined) where.status = filters.status;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
    return where;
  }

  private toDomain(record: AuthenticationUserRecord): User {
    return User.reconstitute({ uuid: record.uuid, username: record.username, email: record.email, phone: record.phone, status: record.status, isActive: record.isActive, isVerified: record.isVerified, createdAt: record.createdAt, updatedAt: record.updatedAt, deletedAt: record.deletedAt });
  }

  private toCreateInput(user: User): Prisma.AuthenticationUserCreateInput {
    return { uuid: user.uuid, username: user.username, email: user.email, phone: user.phone, status: user.status, isActive: user.isActive, isVerified: user.isVerified, deletedAt: user.deletedAt };
  }

  private toUpdateInput(user: User): Prisma.AuthenticationUserUpdateInput {
    return { username: user.username, email: user.email, phone: user.phone, status: user.status, isActive: user.isActive, isVerified: user.isVerified, deletedAt: user.deletedAt };
  }
}
