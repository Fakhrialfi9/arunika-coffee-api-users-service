export abstract class RepositoryError extends Error {
  abstract readonly code: string;

  protected constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export type UserUniqueField = 'username' | 'email' | 'phone';

export class RepositoryUniqueConstraintError extends RepositoryError {
  readonly code = 'REPOSITORY_UNIQUE_CONSTRAINT';

  constructor(
    public readonly field: UserUniqueField,
    cause?: unknown,
  ) {
    super(`Unique constraint violated for ${field}`, { cause });
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  readonly code = 'REPOSITORY_NOT_FOUND';

  constructor(cause?: unknown) {
    super('Repository entity was not found', { cause });
  }
}

export class RepositoryPersistenceError extends RepositoryError {
  readonly code = 'REPOSITORY_PERSISTENCE_FAILURE';

  constructor(cause?: unknown) {
    super('Repository persistence operation failed', { cause });
  }
}
