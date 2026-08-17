import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from './infrastructure/database/database-health.service.js';

@Injectable()
export class AppService {
  constructor(private readonly databaseHealthService: DatabaseHealthService) {}

  async getServiceInformation(): Promise<{
    readonly name: string;
    readonly status: 'ok';
    readonly database: 'up' | 'down';
  }> {
    const database = await this.databaseHealthService.check();

    return {
      name: process.env.APP_NAME ?? 'arunika-coffee-api-users-service',
      status: 'ok',
      database: database.status,
    };
  }
}
