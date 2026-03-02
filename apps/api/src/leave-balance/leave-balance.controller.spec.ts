import { Test, TestingModule } from '@nestjs/testing';
import { LeaveBalanceController } from './leave-balance.controller';

describe('LeaveBalanceController', () => {
  let controller: LeaveBalanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveBalanceController],
    }).compile();

    controller = module.get<LeaveBalanceController>(LeaveBalanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
