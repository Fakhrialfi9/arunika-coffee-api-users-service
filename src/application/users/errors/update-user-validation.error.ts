export class UpdateUserValidationError extends Error {
  readonly code = 'UPDATE_USER_VALIDATION_ERROR';

  constructor(readonly messages: string[]) {
    super(messages.join('; '));
    this.name = 'UpdateUserValidationError';
  }
}
