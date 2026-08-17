import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInformation(): {
    name: string;
    status: string;
  } {
    return {
      name: 'arunika-coffee-api-users-service',
      status: 'ok',
    };
  }
}
