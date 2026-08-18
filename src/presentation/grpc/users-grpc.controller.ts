import { Controller } from '@nestjs/common';

import { CreateUserService } from '../../application/users/services/create-user.service.js';
import { DeleteUserService } from '../../application/users/services/delete-user.service.js';
import { GetUserService } from '../../application/users/services/get-user.service.js';
import { ListUsersService } from '../../application/users/services/list-users.service.js';
import { UpdateUserService } from '../../application/users/services/update-user.service.js';
import type { UserListSortField, UserListSortOrder } from '../../application/users/dto/list-users.dto.js';

type GrpcUser = {
  uuid: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type GrpcListUsersRequest = {
  page?: number;
  limit?: number;
  search?: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  is_active?: boolean;
  is_verified?: boolean;
  sort_by?: string | number;
  sort_order?: string | number;
};

const SORT_FIELDS: Record<string, UserListSortField> = {
  SORT_FIELD_CREATED_AT: 'createdAt',
  SORT_FIELD_UPDATED_AT: 'updatedAt',
  SORT_FIELD_USERNAME: 'username',
  SORT_FIELD_EMAIL: 'email',
  SORT_FIELD_STATUS: 'status',
  SORT_FIELD_UUID: 'uuid',
};

const SORT_ORDERS: Record<string, UserListSortOrder> = {
  SORT_ORDER_ASC: 'asc',
  SORT_ORDER_DESC: 'desc',
};

@Controller()
export class UsersGrpcController {
  constructor(
    private readonly createUser: CreateUserService,
    private readonly getUser: GetUserService,
    private readonly listUsers: ListUsersService,
    private readonly updateUser: UpdateUserService,
    private readonly deleteUser: DeleteUserService,
  ) {}

  async createUserHandler(request: {
    username?: string;
    email?: string;
    phone?: string;
  }): Promise<{ user: GrpcUser }> {
    const user = await this.createUser.execute({
      username: request.username,
      email: request.email,
      phone: request.phone,
    });

    return { user: this.toGrpcUser(user) };
  }

  async getUserHandler(request: { uuid: string }): Promise<{ user: GrpcUser }> {
    const user = await this.getUser.execute({ uuid: request.uuid });

    return { user: this.toGrpcUser(user) };
  }

  async listUsersHandler(
    request: GrpcListUsersRequest,
  ): Promise<{
    items: GrpcUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }> {
    const result = await this.listUsers.execute({
      page: request.page,
      limit: request.limit,
      search: request.search,
      username: request.username,
      email: request.email,
      phone: request.phone,
      status: request.status,
      isActive: request.is_active,
      isVerified: request.is_verified,
      sortBy: this.toSortField(request.sort_by),
      sortOrder: this.toSortOrder(request.sort_order),
    });

    return {
      items: result.items.map((user) => this.toGrpcUser(user)),
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  async updateUserHandler(request: {
    uuid: string;
    username?: string;
    email?: string;
    phone?: string;
    status?: string;
    is_active?: boolean;
    is_verified?: boolean;
  }): Promise<{ user: GrpcUser }> {
    const user = await this.updateUser.execute(request.uuid, {
      username: request.username,
      email: request.email,
      phone: request.phone,
      status: request.status,
      isActive: request.is_active,
      isVerified: request.is_verified,
    });

    return { user: this.toGrpcUser(user) };
  }

  async deleteUserHandler(request: {
    uuid: string;
  }): Promise<{ uuid: string; deleted: boolean }> {
    await this.deleteUser.execute({ uuid: request.uuid });

    return {
      uuid: request.uuid,
      deleted: true,
    };
  }

  private toSortField(value: string | number | undefined): UserListSortField {
    if (typeof value === 'string' && SORT_FIELDS[value]) {
      return SORT_FIELDS[value];
    }

    return 'createdAt';
  }

  private toSortOrder(value: string | number | undefined): UserListSortOrder {
    if (typeof value === 'string' && SORT_ORDERS[value]) {
      return SORT_ORDERS[value];
    }

    return 'desc';
  }

  private toGrpcUser(user: {
    uuid: string;
    username: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): GrpcUser {
    return {
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      is_active: user.isActive,
      is_verified: user.isVerified,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}
