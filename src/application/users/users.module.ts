import { Module } from '@nestjs/common';

import { USER_REPOSITORY } from '../../domain/users/repositories/user.repository.js';
import { PrismaAuthenticationUserRepository } from '../../infrastructure/database/repositories/prisma-authentication-user.repository.js';
import { UsersGrpcController } from '../../presentation/grpc/users-grpc.controller.js';
import { CreateUserService } from './services/create-user.service.js';
import { DeleteUserService } from './services/delete-user.service.js';
import { GetUserService } from './services/get-user.service.js';
import { ListUsersService } from './services/list-users.service.js';
import { UpdateUserService } from './services/update-user.service.js';

@Module({
  controllers: [UsersGrpcController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaAuthenticationUserRepository,
    },
    CreateUserService,
    DeleteUserService,
    GetUserService,
    ListUsersService,
    UpdateUserService,
  ],
  exports: [
    CreateUserService,
    DeleteUserService,
    GetUserService,
    ListUsersService,
    UpdateUserService,
  ],
})
export class UsersModule {}
