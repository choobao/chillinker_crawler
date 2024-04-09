import { Test, TestingModule } from '@nestjs/testing';
import { NaverSeriesService } from './naver-series.service';

describe('NaverSeriesService', () => {
  let service: NaverSeriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NaverSeriesService],
    }).compile();

    service = module.get<NaverSeriesService>(NaverSeriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
