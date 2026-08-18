import { IsUUID } from 'class-validator';

export class DeleteUserDto {
  @IsUUID('4')
  uuid!: string;
}
