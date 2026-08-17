import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { User, type UserIdentityUpdate } from '../../../domain/users/entities/user.entity.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/repositories/user.repository.js';

import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UpdateUserValidationError } from '../errors/update-user-validation.error.js';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';

export interface UpdateUserResult {
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
export class UpdateUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(
    uuid: string,
    input: UpdateUserDto,
  ): Promise<UpdateUserResult> {
    const dto = plainToInstance(UpdateUserDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    if (messages.length > 0) {
      throw new UpdateUserValidationError(messages);
    }

    this.validateUuid(uuid);
    this.ensureAtLeastOneField(dto);

    const user = await this.users.findByUuid(uuid);

    if (user === null) {
      throw new UserNotFoundError(uuid);
    }

    await this.ensureUniqueValues(user, dto);
    this.applyChanges(user, dto);

    try {
      const updated = await this.users.update(user);
      return this.toResult(updated);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new UserAlreadyExistsError(
          this.resolveConflictField(error.meta?.target),
        );
      }

      throw error;
    }
  }

  private async ensureUniqueValues(
    user: User,
    dto: UpdateUserDto,
  ): Promise<void> {
    if (
      dto.username !== undefined &&
      dto.username !== null &&
      dto.username !== user.username &&
      (await this.users.existsByUsername(dto.username, user.uuid))
    ) {
      throw new UserAlreadyExistsError('username');
    }

    if (
      dto.email !== undefined &&
      dto.email !== null &&
      dto.email !== user.email &&
      (await this.users.existsByEmail(dto.email, user.uuid))
    ) {
      throw new UserAlreadyExistsError('email');
    }

    if (
      dto.phone !== undefined &&
      dto.phone !== null &&
      dto.phone !== user.phone &&
      (await this.users.existsByPhone(dto.phone, user.uuid))
    ) {
      throw new UserAlreadyExistsError('phone');
    }
  }

  private applyChanges(user: User, dto: UpdateUserDto): void {
    if (
      dto.username !== undefined ||
      dto.email !== undefined ||
      dto.phone !== undefined
    ) {
      const changes: UserIdentityUpdate = {};

      if (dto.username !== undefined) {
        changes.username = dto.username;
      }

      if (dto.email !== undefined) {
        changes.email = dto.email;
      }

      if (dto.phone !== undefined) {
        changes.phone = dto.phone;
      }

      user.updateIdentity(changes);
    }

    if (dto.status !== undefined && dto.status !== user.status) {
      user.changeStatus(dto.status);
    }

    if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
      if (dto.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    if (dto.isVerified !== undefined && dto.isVerified !== user.isVerified) {
      if (dto.isVerified) {
        user.verify();
      } else {
        user.unverify();
      }
    }
  }

  private ensureAtLeastOneField(dto: UpdateUserDto): void {
    const hasUpdate = [
      dto.username,
      dto.email,
      dto.phone,
      dto.status,
      dto.isActive,
      dto.isVerified,
    ].some((value) => value !== undefined);

    if (!hasUpdate) {
      throw new UpdateUserValidationError([
        'At least one user field must be provided for update',
      ]);
    }
  }

  private validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new UpdateUserValidationError(['User uuid must be a valid UUID']);
    }
  }

  private toResult(user: User): UpdateUserResult {
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

  private resolveConflictField(
    target: unknown,
  ): 'username' | 'email' | 'phone' {
    const fields = Array.isArray(target)
      ? target.map(String)
      : [String(target)];

    if (fields.includes('email')) return 'email';
    if (fields.includes('phone')) return 'phone';
    return 'username';
  }
}
