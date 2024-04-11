import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { RidiCrawlerController } from './ridibooks/ridi.crawler.controller';
import { RidiCrawlerService } from './ridibooks/ridi.crawler.service';
import { KakaopageService } from './kakaopage/kakaopage.service';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebContents } from '../db/entities/webContents.entity';
import { PReviews } from '../db/entities/platform.reviews.entity';
import { MrblueController } from './mrblue/mrblue.controller';
import { MrblueService } from './mrblue/mrblue.service';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([WebContents, PReviews])],
  controllers: [CrawlerController, RidiCrawlerController, MrblueController],
  providers: [
    CrawlerService,
    RidiCrawlerService,
    KakaopageService,
    ,
    MrblueService,
  ],
})
export class CrawlerModule {}
