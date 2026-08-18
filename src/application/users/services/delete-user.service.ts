import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/repositories/user.repository.js';

import { DeleteUserDto } from '../dto/delete-user.dto.js';
import { DeleteUserValidationError } from '../errors/delete-user-validation.error.js';
import { UserNotFoundError } from '../errors/user-not-found.error.js';

@Injectable()
export class DeleteUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: DeleteUserDto): Promise<void> {
    const dto = plainToInstance(DeleteUserDto, input);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    if (messages.length > 0) {
      throw new DeleteUserValidationError(messages);
    }

    const user = await this.users.findByUuid(dto.uuid);

    if (user === null || user.deletedAt !== null) {
      throw new UserNotFoundError(dto.uuid);
    }

    user.softDelete();
    await this.users.update(user);
  }
}
