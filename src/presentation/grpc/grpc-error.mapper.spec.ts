import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { describe, expect, it } from 'vitest';

import { CreateUserValidationError } from '../../application/users/errors/create-user-validation.error.js';
import { UserAlreadyExistsError } from '../../application/users/errors/user-already-exists.error.js';
import { UserNotFoundError } from '../../application/users/errors/user-not-found.error.js';
import { toGrpcException } from './grpc-error.mapper.js';

const getCode = (exception: RpcException): number => {
  const error = exception.getError();
  return typeof error === 'object' && error !== null && 'code' in error
    ? Number(error.code)
    : status.UNKNOWN;
};

describe('toGrpcException', () => {
  it('preserves existing RpcException instances', () => {
    const exception = new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Invalid request',
    });

    expect(toGrpcException(exception)).toBe(exception);
  });

  it('maps validation errors to INVALID_ARGUMENT', () => {
    expect(
      getCode(toGrpcException(new CreateUserValidationError('invalid email'))),
    ).toBe(status.INVALID_ARGUMENT);
  });

  it('maps missing users to NOT_FOUND', () => {
    expect(getCode(toGrpcException(new UserNotFoundError('missing')))).toBe(
      status.NOT_FOUND,
    );
  });

  it('maps duplicate users to ALREADY_EXISTS', () => {
    expect(
      getCode(toGrpcException(new UserAlreadyExistsError('duplicate'))),
    ).toBe(status.ALREADY_EXISTS);
  });

  it('does not leak unexpected internal errors', () => {
    const exception = toGrpcException(
      new Error('database credentials: secret'),
    );
    expect(getCode(exception)).toBe(status.INTERNAL);
    expect(exception.getError()).toMatchObject({
      message: 'Internal server error',
    });
  });
});
