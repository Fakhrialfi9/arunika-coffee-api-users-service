import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { User } from '../../../domain/users/entities/user.entity.js';
import type { UserRepository } from '../../../domain/users/repositories/user.repository.js';
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
  constructor(private readonly prisma: PrismaService) {}

  async findByUuid(uuid: string): Promise<User | null> {
    const record = await this.prisma.authenticationUser.findUnique({
      where: { uuid },
    });

    return record === null ? null : this.toDomain(record);
  }

  async create(user: User): Promise<User> {
    const record = await this.prisma.authenticationUser.create({
      data: this.toCreateInput(user),
    });

    return this.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const record = await this.prisma.authenticationUser.update({
      where: { uuid: user.uuid },
      data: this.toUpdateInput(user),
    });

    return this.toDomain(record);
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
