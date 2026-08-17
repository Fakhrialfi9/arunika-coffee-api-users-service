import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './config/app.config.js';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getServiceInfo(): {
    name: string;
    status: string;
    environment: string;
  } {
    return {
      name: this.configService.getOrThrow<AppConfig['name']>('app.name'),
      status: 'ok',
      environment:
        this.configService.getOrThrow<AppConfig['environment']>(
          'app.environment',
        ),
    };
  }
}
