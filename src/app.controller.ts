import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getServiceInfo(): {
    name: string;
    status: string;
    environment: string;
  } {
    return this.appService.getServiceInfo();
  }
}
