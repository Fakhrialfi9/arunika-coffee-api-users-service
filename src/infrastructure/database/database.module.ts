import { Global, Module } from '@nestjs/common';

import { DatabaseHealthService } from './database-health.service.js';
import { PrismaAuthenticationUserRepository } from './repositories/prisma-authentication-user.repository.js';
import { PrismaService } from './prisma.service.js';
import { PrismaTransactionService } from './prisma-transaction.service.js';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaTransactionService,
    PrismaAuthenticationUserRepository,
    DatabaseHealthService,
  ],
  exports: [
    PrismaService,
    PrismaTransactionService,
    PrismaAuthenticationUserRepository,
    DatabaseHealthService,
  ],
})
export class DatabaseModule {}
