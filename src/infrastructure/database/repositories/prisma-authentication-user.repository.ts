import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type {
  UserListFilters,
  UserListResult,
  UserRepository,
} from '../../../domain/users/repositories/user.repository.js';
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
      where: {
        uuid,
        deletedAt: null,
      },
    });

    return record === null ? null : this.toDomain(record);
  }

  async existsByUsername(
    username: string,
    excludeUuid?: string,
  ): Promise<boolean> {
    const record = await this.prisma.authenticationUser.findFirst({
      where: {
        username,
        ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }),
      },
      select: { id: true },
    });

    return record !== null;
  }

  async existsByEmail(
    email: string,
    excludeUuid?: string,
  ): Promise<boolean> {
    const record = await this.prisma.authenticationUser.findFirst({
      where: {
        email,
        ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }),
      },
      select: { id: true },
    });

    return record !== null;
  }

  async existsByPhone(
    phone: string,
    excludeUuid?: string,
  ): Promise<boolean> {
    const record = await this.prisma.authenticationUser.findFirst({
      where: {
        phone,
        ...(excludeUuid === undefined ? {} : { uuid: { not: excludeUuid } }),
      },
      select: { id: true },
    });

    return record !== null;
  }

  async create(user: User): Promise<User> {
    const record = await this.transactions.run((transaction) =>
      transaction.authenticationUser.create({
        data: this.toCreateInput(user),
      }),
    );

    return this.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const record = await this.transactions.run((transaction) =>
      transaction.authenticationUser.update({
        where: { uuid: user.uuid },
        data: this.toUpdateInput(user),
      }),
    );

    return this.toDomain(record);
  }

  async list(filters: UserListFilters): Promise<UserListResult> {
    const where = this.toListWhere(filters);
    const skip = (filters.page - 1) * filters.limit;
    const orderBy = [
      { [filters.sortBy]: filters.sortOrder },
      { uuid: 'asc' },
    ] as Prisma.AuthenticationUserOrderByWithRelationInput[];

    const result = await this.transactions.run(async (transaction) => {
      const [records, total] = await Promise.all([
        transaction.authenticationUser.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy,
        }),
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
  }

  private toListWhere(
    filters: UserListFilters,
  ): Prisma.AuthenticationUserWhereInput {
    const where: Prisma.AuthenticationUserWhereInput = {
      deletedAt: null,
    };

    if (filters.search !== undefined) {
      where.OR = [
        { username: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters.username !== undefined) {
      where.username = filters.username;
    }

    if (filters.email !== undefined) {
      where.email = filters.email;
    }

    if (filters.phone !== undefined) {
      where.phone = filters.phone;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return where;
  }

  private toDomain(record: AuthenticationUserRecord): User {
    return User.reconstitute({
      uuid: record.uuid,
      username: record.username,
      email: record.email,
      phone: record.phone,
      status: record.status,
      isActive: record.isActive,
      isVerified: record.isVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  private toCreateInput(user: User): Prisma.AuthenticationUserCreateInput {
    return {
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isActive: user.isActive,
      isVerified: user.isVerified,
      deletedAt: user.deletedAt,
    };
  }

  private toUpdateInput(user: User): Prisma.AuthenticationUserUpdateInput {
    return {
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isActive: user.isActive,
      isVerified: user.isVerified,
      deletedAt: user.deletedAt,
    };
  }
}
