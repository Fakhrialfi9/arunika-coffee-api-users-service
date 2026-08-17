import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getServiceInformation(): Promise<{
    readonly name: string;
    readonly status: 'ok';
    readonly database: 'up' | 'down';
  }> {
    return this.appService.getServiceInformation();
  }
}
