import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { User } from '../../../domain/users/entities/user.entity.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/repositories/user.repository.js';

import { CreateUserValidationError } from '../errors/create-user-validation.error.js';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

export interface CreateUserResult {
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
export class CreateUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: CreateUserDto): Promise<CreateUserResult> {
    const dto = plainToInstance(CreateUserDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    if (messages.length > 0) {
      throw new CreateUserValidationError(messages);
    }

    if (!dto.username && !dto.email && !dto.phone) {
      throw new CreateUserValidationError([
        'At least one of username, email, or phone is required',
      ]);
    }

    if (dto.username && (await this.users.existsByUsername(dto.username))) {
      throw new UserAlreadyExistsError('username');
    }

    if (dto.email && (await this.users.existsByEmail(dto.email))) {
      throw new UserAlreadyExistsError('email');
    }

    if (dto.phone && (await this.users.existsByPhone(dto.phone))) {
      throw new UserAlreadyExistsError('phone');
    }

    const user = User.create({
      username: dto.username ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
    });

    try {
      const created = await this.users.create(user);
      return this.toResult(created);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new UserAlreadyExistsError(
          this.resolveConflictField(error.meta?.target),
        );
      }

      throw error;
    }
  }

  private toResult(user: User): CreateUserResult {
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

  private isUniqueConstraintError(
    error: unknown,
  ): error is { code: 'P2002'; meta?: { target?: unknown } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private resolveConflictField(target: unknown): 'username' | 'email' | 'phone' {
    const fields = Array.isArray(target) ? target.map(String) : [String(target)];

    if (fields.includes('email')) return 'email';
    if (fields.includes('phone')) return 'phone';
    return 'username';
  }
}
