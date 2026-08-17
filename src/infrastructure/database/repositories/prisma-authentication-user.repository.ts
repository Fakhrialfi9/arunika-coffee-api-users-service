import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaAuthenticationUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUuid(uuid: string) {
    return this.prisma.authenticationUser.findUnique({
      where: { uuid },
    });
  }

  findById(id: bigint) {
    return this.prisma.authenticationUser.findUnique({
      where: { id },
    });
  }

  create(data: Prisma.AuthenticationUserCreateInput) {
    return this.prisma.authenticationUser.create({ data });
  }

  updateByUuid(uuid: string, data: Prisma.AuthenticationUserUpdateInput) {
    return this.prisma.authenticationUser.update({
      where: { uuid },
      data,
    });
  }

  softDeleteByUuid(uuid: string, deletedAt: Date) {
    return this.prisma.authenticationUser.update({
      where: { uuid },
      data: { deletedAt },
    });
  }
}
