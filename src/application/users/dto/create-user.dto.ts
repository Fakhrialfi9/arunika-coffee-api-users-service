import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  username?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  phone?: string | null;
}
