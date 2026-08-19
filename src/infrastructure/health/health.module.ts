import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { GrpcHealthService } from './grpc-health.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [GrpcHealthService],
  exports: [GrpcHealthService],
})
export class HealthModule {}
