import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import type { User } from '../../../domain/users/entities/user.entity.js';
import {
  USER_REPOSITORY,
  type UserListFilters,
  type UserListResult,
  type UserRepository,
} from '../../../domain/users/repositories/user.repository.js';
import { ListUsersDto } from '../dto/list-users.dto.js';
import { ListUsersValidationError } from '../errors/list-users-validation.error.js';

export interface ListUsersItem {
  uuid: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResult {
  items: ListUsersItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ListUsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: ListUsersDto): Promise<ListUsersResult> {
    const dto = plainToInstance(ListUsersDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    if (messages.length > 0) {
      throw new ListUsersValidationError(messages);
    }

    const filters: UserListFilters = {
      page: dto.page,
      limit: dto.limit,
      search: this.normalizeOptionalString(dto.search),
      username: this.normalizeOptionalString(dto.username),
      email: this.normalizeOptionalString(dto.email),
      phone: this.normalizeOptionalString(dto.phone),
      status: this.normalizeOptionalString(dto.status),
      isActive: dto.isActive,
      isVerified: dto.isVerified,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    const result = await this.users.list(filters);

    return this.toResult(result);
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized === '' ? undefined : normalized;
  }

  private toResult(result: UserListResult): ListUsersResult {
    return {
      items: result.items.map((user) => this.toItem(user)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  private toItem(user: User): ListUsersItem {
    return {
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
