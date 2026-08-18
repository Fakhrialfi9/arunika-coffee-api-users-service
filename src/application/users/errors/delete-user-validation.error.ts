export class DeleteUserValidationError extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join('; '));
    this.name = DeleteUserValidationError.name;
  }
}
