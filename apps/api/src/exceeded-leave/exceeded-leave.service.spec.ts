import { Test, TestingModule } from '@nestjs/testing';
import { ExceededLeaveService } from './exceeded-leave.service';

describe('ExceededLeaveService', () => {
  let service: ExceededLeaveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceededLeaveService],
    }).compile();

    service = module.get<ExceededLeaveService>(ExceededLeaveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
