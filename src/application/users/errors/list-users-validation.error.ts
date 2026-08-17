export class ListUsersValidationError extends Error {
  constructor(readonly messages: string[]) {
    super('List users input validation failed');
    this.name = 'ListUsersValidationError';
  }
}
