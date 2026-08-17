import { Module } from '@nestjs/common';

import {
  USER_REPOSITORY,
} from '../../domain/users/repositories/user.repository.js';
import { PrismaAuthenticationUserRepository } from '../../infrastructure/database/repositories/prisma-authentication-user.repository.js';
import { CreateUserService } from './services/create-user.service.js';

@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaAuthenticationUserRepository,
    },
    CreateUserService,
  ],
  exports: [CreateUserService],
})
export class UsersModule {}
