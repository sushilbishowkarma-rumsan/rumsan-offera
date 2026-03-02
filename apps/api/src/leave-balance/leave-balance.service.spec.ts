import { Test, TestingModule } from '@nestjs/testing';
import { LeaveBalanceService } from './leave-balance.service';

describe('LeaveBalanceService', () => {
  let service: LeaveBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaveBalanceService],
    }).compile();

    service = module.get<LeaveBalanceService>(LeaveBalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
