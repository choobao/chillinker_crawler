import { Controller, Get, Query } from '@nestjs/common';
import { MrblueService } from './mrblue.service';

@Controller('mrblue')
export class MrblueController {
  constructor(private readonly mrblueService: MrblueService) {}
  @Get('webnovels')
  getWebnovels() {
    const result = this.mrblueService.crawlWebnovels();
    return result;
  }

  @Get('webnovelRanking')
  getebnovelRanking() {
    const result = this.mrblueService.webnovelRank();
    return result;
  }

  @Get('webtoons')
  getWebtoons() {
    return this.mrblueService.crawlWebtoons();
  }

  @Get('webtoonRanking')
  getebntoonRanking() {
    const result = this.mrblueService.webtoonRank();
    return result;
  }
}
