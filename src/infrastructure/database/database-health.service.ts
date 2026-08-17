import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

export interface DatabaseHealthResult {
  readonly status: 'up' | 'down';
}

@Injectable()
export class DatabaseHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<DatabaseHealthResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
      };
    } catch {
      return {
        status: 'down',
      };
    }
  }
}
