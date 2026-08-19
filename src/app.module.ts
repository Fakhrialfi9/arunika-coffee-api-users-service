import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './application/users/users.module.js';
import { appConfig } from './config/app.config.js';
import { validateEnvironment } from './config/env.validation.js';
import { ObservabilityModule } from './observability/observability.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validate: validateEnvironment,
    }),
    ObservabilityModule,
    DatabaseModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
