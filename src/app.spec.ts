import { Test } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppService', () => {
  it('returns the health check text', () => {
    expect(new AppService().getHello()).toBe('Easy Óleo API — ok');
  });
});

describe('AppController', () => {
  it('delegates getHello to AppService', async () => {
    const service = { getHello: jest.fn().mockReturnValue('ok') };
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: service }],
    }).compile();

    expect(moduleRef.get(AppController).getHello()).toBe('ok');
    expect(service.getHello).toHaveBeenCalledTimes(1);
  });
});
