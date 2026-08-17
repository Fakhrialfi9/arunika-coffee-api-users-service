import { randomUUID } from 'node:crypto';

export type UserStatus = string;

export interface UserProps {
  uuid?: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: UserStatus;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ReconstituteUserProps extends UserProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(
    private readonly _uuid: string,
    private _username: string | null,
    private _email: string | null,
    private _phone: string | null,
    private _status: UserStatus,
    private _isActive: boolean,
    private _isVerified: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null,
  ) {}

  static create(props: UserProps = {}): User {
    const now = new Date();

    return new User(
      props.uuid ?? randomUUID(),
      props.username ?? null,
      props.email ?? null,
      props.phone ?? null,
      props.status ?? 'pending',
      props.isActive ?? true,
      props.isVerified ?? false,
      props.createdAt ?? now,
      props.updatedAt ?? now,
      props.deletedAt ?? null,
    ).validate();
  }

  static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.uuid,
      props.username ?? null,
      props.email ?? null,
      props.phone ?? null,
      props.status ?? 'pending',
      props.isActive ?? true,
      props.isVerified ?? false,
      props.createdAt,
      props.updatedAt,
      props.deletedAt ?? null,
    ).validate();
  }

  get uuid(): string {
    return this._uuid;
  }

  get username(): string | null {
    return this._username;
  }

  get email(): string | null {
    return this._email;
  }

  get phone(): string | null {
    return this._phone;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt.getTime());
  }

  get deletedAt(): Date | null {
    return this._deletedAt === null ? null : new Date(this._deletedAt.getTime());
  }

  activate(): void {
    this.ensureNotDeleted();
    this._isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.ensureNotDeleted();
    this._isActive = false;
    this.touch();
  }

  verify(): void {
    this.ensureNotDeleted();
    this._isVerified = true;
    this.touch();
  }

  unverify(): void {
    this.ensureNotDeleted();
    this._isVerified = false;
    this.touch();
  }

  changeStatus(status: UserStatus): void {
    this._status = User.validateStatus(status);
    this.touch();
  }

  softDelete(deletedAt: Date = new Date()): void {
    if (this._deletedAt !== null) {
      throw new Error('User is already deleted');
    }

    this._deletedAt = new Date(deletedAt.getTime());
    this._isActive = false;
    this.touch();
  }

  restore(): void {
    if (this._deletedAt === null) {
      throw new Error('User is not deleted');
    }

    this._deletedAt = null;
    this._isActive = true;
    this.touch();
  }

  private ensureNotDeleted(): void {
    if (this._deletedAt !== null) {
      throw new Error('Deleted user cannot be modified');
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private validate(): User {
    User.validateUuid(this._uuid);
    User.validateOptionalString(this._username, 'username', 100);
    User.validateOptionalString(this._email, 'email', 191);
    User.validateOptionalString(this._phone, 'phone', 30);
    this._status = User.validateStatus(this._status);

    if (this._deletedAt !== null && Number.isNaN(this._deletedAt.getTime())) {
      throw new Error('deletedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new Error('User uuid must be a valid UUID');
    }
  }

  private static validateStatus(status: UserStatus): UserStatus {
    const normalized = status.trim();

    if (normalized.length === 0 || normalized.length > 30) {
      throw new Error('User status must contain between 1 and 30 characters');
    }

    return normalized;
  }

  private static validateOptionalString(value: string | null, field: string, maxLength: number): void {
    if (value !== null && value.length > maxLength) {
      throw new Error(`User ${field} must not exceed ${maxLength} characters`);
    }
  }
}
