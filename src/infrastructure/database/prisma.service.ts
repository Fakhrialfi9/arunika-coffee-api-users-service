import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaMariaDb({
      host: PrismaService.getRequiredEnv('DATABASE_HOST'),
      port: PrismaService.getRequiredPort('DATABASE_PORT'),
      user: PrismaService.getRequiredEnv('DATABASE_USER'),
      password: PrismaService.getRequiredEnv('DATABASE_PASSWORD'),
      database: PrismaService.getRequiredEnv('DATABASE_NAME'),
    });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private static getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (value === undefined || value.trim().length === 0) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  }

  private static getRequiredPort(name: string): number {
    const value = PrismaService.getRequiredEnv(name);
    const port = Number(value);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port in environment variable: ${name}`);
    }

    return port;
  }
}
