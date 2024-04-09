import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { RidiCrawlerController } from './ridibooks/ridi.crawler.controller';
import { RidiCrawlerService } from './ridibooks/ridi.crawler.service';

@Module({
  controllers: [CrawlerController, RidiCrawlerController],
  providers: [CrawlerService, RidiCrawlerService],
})
export class CrawlerModule {}
