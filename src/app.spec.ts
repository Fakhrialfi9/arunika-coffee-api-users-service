import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  it('should return service information', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getServiceInfo: () => ({
              name: 'arunika-coffee-api-users-service',
              status: 'ok',
              environment: 'test',
            }),
          },
        },
      ],
    }).compile();

    const controller = module.get<AppController>(AppController);

    expect(controller.getServiceInfo()).toEqual({
      name: 'arunika-coffee-api-users-service',
      status: 'ok',
      environment: 'test',
    });
  });
});
