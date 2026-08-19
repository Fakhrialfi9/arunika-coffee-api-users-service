import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

import { CreateUserValidationError } from '../../application/users/errors/create-user-validation.error.js';
import { DeleteUserValidationError } from '../../application/users/errors/delete-user-validation.error.js';
import { GetUserValidationError } from '../../application/users/errors/get-user-validation.error.js';
import { ListUsersValidationError } from '../../application/users/errors/list-users-validation.error.js';
import { UpdateUserValidationError } from '../../application/users/errors/update-user-validation.error.js';
import { UserAlreadyExistsError } from '../../application/users/errors/user-already-exists.error.js';
import { UserNotFoundError } from '../../application/users/errors/user-not-found.error.js';

const VALIDATION_ERRORS = [
  CreateUserValidationError,
  GetUserValidationError,
  ListUsersValidationError,
  UpdateUserValidationError,
  DeleteUserValidationError,
] as const;

export function toGrpcException(error: unknown): RpcException {
  if (error instanceof RpcException) {
    return error;
  }

  if (error instanceof UserNotFoundError) {
    return new RpcException({
      code: status.NOT_FOUND,
      message: error.message,
    });
  }

  if (error instanceof UserAlreadyExistsError) {
    return new RpcException({
      code: status.ALREADY_EXISTS,
      message: error.message,
    });
  }

  if (VALIDATION_ERRORS.some((ErrorType) => error instanceof ErrorType)) {
    return new RpcException({
      code: status.INVALID_ARGUMENT,
      message: error instanceof Error ? error.message : 'Invalid request',
    });
  }

  return new RpcException({
    code: status.INTERNAL,
    message: 'Internal server error',
  });
}
