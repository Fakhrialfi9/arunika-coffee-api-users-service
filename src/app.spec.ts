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
            getServiceInformation: () => ({
              name: 'arunika-coffee-api-users-service',
              status: 'ok' as const,
              database: 'up' as const,
            }),
          },
        },
      ],
    }).compile();

    const controller = module.get<AppController>(AppController);

    expect(controller.getServiceInformation()).toEqual({
      name: 'arunika-coffee-api-users-service',
      status: 'ok',
      database: 'up',
    });

    await module.close();
  });
});
