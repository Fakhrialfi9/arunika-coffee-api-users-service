export class CreateUserValidationError extends Error {
  constructor(public readonly messages: string[]) {
    super('Create user input is invalid');
    this.name = 'CreateUserValidationError';
  }
}
