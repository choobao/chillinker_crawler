import { Test, TestingModule } from '@nestjs/testing';
import { KakaopageService } from './kakaopage.service';

describe('KakaopageService', () => {
  let service: KakaopageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KakaopageService],
    }).compile();

    service = module.get<KakaopageService>(KakaopageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
