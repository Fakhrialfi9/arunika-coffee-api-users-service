import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { User } from '../../../domain/users/entities/user.entity.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/repositories/user.repository.js';

import { GetUserDto } from '../dto/get-user.dto.js';
import { GetUserValidationError } from '../errors/get-user-validation.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';

export interface GetUserResult {
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

@Injectable()
export class GetUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: GetUserDto): Promise<GetUserResult> {
    const dto = plainToInstance(GetUserDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    if (messages.length > 0) {
      throw new GetUserValidationError(messages);
    }

    const user = await this.users.findByUuid(dto.uuid);

    if (user === null || user.deletedAt !== null) {
      throw new UserNotFoundError(dto.uuid);
    }

    return this.toResult(user);
  }

  private toResult(user: User): GetUserResult {
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
