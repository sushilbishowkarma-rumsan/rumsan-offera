import { Test, TestingModule } from '@nestjs/testing';
import { LeavePolicyService } from './leave-policy.service';

describe('LeavePolicyService', () => {
  let service: LeavePolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeavePolicyService],
    }).compile();

    service = module.get<LeavePolicyService>(LeavePolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
