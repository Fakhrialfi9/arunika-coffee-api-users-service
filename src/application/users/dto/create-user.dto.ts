import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  username?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  @Transform(normalizeEmail)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  phone?: string | null;
}
