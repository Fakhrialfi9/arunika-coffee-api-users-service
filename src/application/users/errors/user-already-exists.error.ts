export type UserUniqueConflictField = 'username' | 'email' | 'phone';

export class UserAlreadyExistsError extends Error {
  constructor(public readonly field: UserUniqueConflictField) {
    super(`User with this ${field} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}
