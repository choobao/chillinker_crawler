import { Controller, Get } from '@nestjs/common';
import { KakaoCrawlerService } from './kakao-crawler.service';

@Controller('novels')
export class NovelsController {
  constructor(private readonly kakaoCrawlerService: KakaoCrawlerService) {}

  @Get('best')
  async getPopularNovels(): Promise<any> {
    return this.kakaoCrawlerService.getPopularNovels();
  }
}
