export class UserNotFoundError extends Error {
  constructor(uuid: string) {
    super(`User with uuid ${uuid} was not found`);
    this.name = UserNotFoundError.name;
  }
}
