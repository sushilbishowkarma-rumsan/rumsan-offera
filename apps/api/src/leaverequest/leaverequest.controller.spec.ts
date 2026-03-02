import { Test, TestingModule } from '@nestjs/testing';
import { LeaverequestController } from './leaverequest.controller';

describe('LeaverequestController', () => {
  let controller: LeaverequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaverequestController],
    }).compile();

    controller = module.get<LeaverequestController>(LeaverequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
