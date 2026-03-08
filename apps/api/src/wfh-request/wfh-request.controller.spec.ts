import { Test, TestingModule } from '@nestjs/testing';
import { WfhRequestController } from './wfh-request.controller';

describe('WfhRequestController', () => {
  let controller: WfhRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WfhRequestController],
    }).compile();

    controller = module.get<WfhRequestController>(WfhRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
