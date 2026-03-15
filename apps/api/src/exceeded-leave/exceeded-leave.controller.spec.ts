import { Test, TestingModule } from '@nestjs/testing';
import { ExceededLeaveController } from './exceeded-leave.controller';

describe('ExceededLeaveController', () => {
  let controller: ExceededLeaveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExceededLeaveController],
    }).compile();

    controller = module.get<ExceededLeaveController>(ExceededLeaveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
