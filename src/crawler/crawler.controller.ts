import { Controller, Get } from '@nestjs/common';
import { KakaopageService } from './kakaopage/kakaopage.service';
import { Type } from './constants/kakaopage';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly kakaoService: KakaopageService) {}

  @Get('test')
  async test() {
    //return await this.kakaoService.getDailyRank_20_WebContents(Type.WEBNOVEL);
    return await this.kakaoService.getAll_96_WebContents(Type.WEBNOVEL);
  }
}
