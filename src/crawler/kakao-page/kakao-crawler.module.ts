import { Module } from '@nestjs/common';
import { KakaoCrawlerService } from './kakao-crawler.service';
import { NovelsController } from './kakao-crawler.controller';

@Module({
  controllers: [NovelsController],
  exports: [KakaoCrawlerService],
  providers: [KakaoCrawlerService],
})
export class KakaoCrawlerModule {}
