import { Test, TestingModule } from '@nestjs/testing';
import { LeaverequestService } from './leaverequest.service';

describe('LeaverequestService', () => {
  let service: LeaverequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaverequestService],
    }).compile();

    service = module.get<LeaverequestService>(LeaverequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
