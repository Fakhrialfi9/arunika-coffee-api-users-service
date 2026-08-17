import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const USER_LIST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'username',
  'email',
  'status',
  'uuid',
] as const;

export type UserListSortField = (typeof USER_LIST_SORT_FIELDS)[number];

export const USER_LIST_SORT_ORDERS = ['asc', 'desc'] as const;

export type UserListSortOrder = (typeof USER_LIST_SORT_ORDERS)[number];

const transformBooleanQuery = ({ value }: { value: unknown }): unknown => {
  if (value === undefined) {
    return value;
  }

  if (value === 'true' || value === true) {
    return true;
  }

  if (value === 'false' || value === false) {
    return false;
  }

  return value;
};

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  @IsOptional()
  @Transform(transformBooleanQuery)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(transformBooleanQuery)
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsIn(USER_LIST_SORT_FIELDS)
  sortBy: UserListSortField = 'createdAt';

  @IsOptional()
  @IsIn(USER_LIST_SORT_ORDERS)
  sortOrder: UserListSortOrder = 'desc';
}
