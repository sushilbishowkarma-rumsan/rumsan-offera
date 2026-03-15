import { Test, TestingModule } from '@nestjs/testing';
import { LeaveResetCronService } from './leave-reset-cron.service';

describe('LeaveResetCronService', () => {
  let service: LeaveResetCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaveResetCronService],
    }).compile();

    service = module.get<LeaveResetCronService>(LeaveResetCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
