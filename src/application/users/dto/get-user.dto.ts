import { IsUUID } from 'class-validator';

export class GetUserDto {
  @IsUUID('4')
  uuid!: string;
}
