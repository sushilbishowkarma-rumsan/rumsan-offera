import { Test, TestingModule } from '@nestjs/testing';
import { WfhRequestService } from './wfh-request.service';

describe('WfhRequestService', () => {
  let service: WfhRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WfhRequestService],
    }).compile();

    service = module.get<WfhRequestService>(WfhRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
