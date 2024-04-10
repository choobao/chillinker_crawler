import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { RidiCrawlerController } from './ridibooks/ridi.crawler.controller';
import { RidiCrawlerService } from './ridibooks/ridi.crawler.service';
import { MrblueController } from './mrblue/mrblue.controller';
import { MrblueService } from './mrblue/mrblue.service';

@Module({
  controllers: [CrawlerController, RidiCrawlerController, MrblueController],
  providers: [CrawlerService, RidiCrawlerService, MrblueService],
})
export class CrawlerModule {}
