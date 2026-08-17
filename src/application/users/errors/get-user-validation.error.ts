export class GetUserValidationError extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join('; '));
    this.name = GetUserValidationError.name;
  }
}
