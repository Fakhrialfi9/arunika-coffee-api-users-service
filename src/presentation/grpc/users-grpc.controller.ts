import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import type {
  UserListSortField,
  UserListSortOrder,
} from '../../application/users/dto/list-users.dto.js';
import { CreateUserService } from '../../application/users/services/create-user.service.js';
import { DeleteUserService } from '../../application/users/services/delete-user.service.js';
import { GetUserService } from '../../application/users/services/get-user.service.js';
import { ListUsersService } from '../../application/users/services/list-users.service.js';
import { UpdateUserService } from '../../application/users/services/update-user.service.js';
import { toGrpcException } from './grpc-error.mapper.js';

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

const SORT_FIELDS = {
  SORT_FIELD_CREATED_AT: 'createdAt',
  SORT_FIELD_UPDATED_AT: 'updatedAt',
  SORT_FIELD_USERNAME: 'username',
  SORT_FIELD_EMAIL: 'email',
  SORT_FIELD_STATUS: 'status',
  SORT_FIELD_UUID: 'uuid',
} as const satisfies Record<string, UserListSortField>;

const SORT_ORDERS = {
  SORT_ORDER_ASC: 'asc',
  SORT_ORDER_DESC: 'desc',
} as const satisfies Record<string, UserListSortOrder>;

@Controller()
export class UsersGrpcController {
  constructor(
    private readonly createUser: CreateUserService,
    private readonly getUser: GetUserService,
    private readonly listUsers: ListUsersService,
    private readonly updateUser: UpdateUserService,
    private readonly deleteUser: DeleteUserService,
  ) {}

  @GrpcMethod('UsersService', 'CreateUser')
  async createUserHandler(request: {
    username?: string;
    email?: string;
    phone?: string;
  }): Promise<{ user: GrpcUser }> {
    return this.handle(async () => ({
      user: this.toGrpcUser(
        await this.createUser.execute({
          ...(request.username !== undefined && { username: request.username }),
          ...(request.email !== undefined && { email: request.email }),
          ...(request.phone !== undefined && { phone: request.phone }),
        }),
      ),
    }));
  }

  @GrpcMethod('UsersService', 'GetUser')
  async getUserHandler(request: { uuid: string }): Promise<{ user: GrpcUser }> {
    return this.handle(async () => ({
      user: this.toGrpcUser(await this.getUser.execute({ uuid: request.uuid })),
    }));
  }

  @GrpcMethod('UsersService', 'ListUsers')
  async listUsersHandler(request: GrpcListUsersRequest): Promise<{
    items: GrpcUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }> {
    return this.handle(async () => {
      const result = await this.listUsers.execute({
        ...(request.page !== undefined &&
          request.page !== 0 && {
            page: this.toPositiveInteger(request.page, 'page'),
          }),
        ...(request.limit !== undefined &&
          request.limit !== 0 && {
            limit: this.toPositiveInteger(request.limit, 'limit'),
          }),
        ...(request.search !== undefined && { search: request.search }),
        ...(request.username !== undefined && { username: request.username }),
        ...(request.email !== undefined && { email: request.email }),
        ...(request.phone !== undefined && { phone: request.phone }),
        ...(request.status !== undefined && { status: request.status }),
        ...(request.is_active !== undefined && { isActive: request.is_active }),
        ...(request.is_verified !== undefined && {
          isVerified: request.is_verified,
        }),
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
    });
  }

  @GrpcMethod('UsersService', 'UpdateUser')
  async updateUserHandler(request: {
    uuid: string;
    username?: string;
    email?: string;
    phone?: string;
    status?: string;
    is_active?: boolean;
    is_verified?: boolean;
  }): Promise<{ user: GrpcUser }> {
    return this.handle(async () => ({
      user: this.toGrpcUser(
        await this.updateUser.execute(request.uuid, {
          ...(request.username !== undefined && { username: request.username }),
          ...(request.email !== undefined && { email: request.email }),
          ...(request.phone !== undefined && { phone: request.phone }),
          ...(request.status !== undefined && { status: request.status }),
          ...(request.is_active !== undefined && {
            isActive: request.is_active,
          }),
          ...(request.is_verified !== undefined && {
            isVerified: request.is_verified,
          }),
        }),
      ),
    }));
  }

  @GrpcMethod('UsersService', 'DeleteUser')
  async deleteUserHandler(request: {
    uuid: string;
  }): Promise<{ uuid: string; deleted: boolean }> {
    return this.handle(async () => {
      await this.deleteUser.execute({ uuid: request.uuid });
      return { uuid: request.uuid, deleted: true };
    });
  }

  private async handle<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw toGrpcException(error);
    }
  }

  private toPositiveInteger(value: number, field: string): number {
    if (!Number.isInteger(value) || value < 1) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `${field} must be a positive integer`,
      });
    }

    return value;
  }

  private toSortField(value: string | number | undefined): UserListSortField {
    if (
      value === undefined ||
      value === 'SORT_FIELD_UNSPECIFIED' ||
      value === 0
    ) {
      return 'createdAt';
    }

    if (typeof value === 'string') {
      const sortField = SORT_FIELDS[value as keyof typeof SORT_FIELDS];
      if (sortField !== undefined) {
        return sortField;
      }
    }

    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'sort_by contains an unsupported value',
    });
  }

  private toSortOrder(value: string | number | undefined): UserListSortOrder {
    if (
      value === undefined ||
      value === 'SORT_ORDER_UNSPECIFIED' ||
      value === 0
    ) {
      return 'desc';
    }

    if (typeof value === 'string') {
      const sortOrder = SORT_ORDERS[value as keyof typeof SORT_ORDERS];
      if (sortOrder !== undefined) {
        return sortOrder;
      }
    }

    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'sort_order contains an unsupported value',
    });
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
