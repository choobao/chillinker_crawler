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

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([WebContents, PReviews])],
  controllers: [CrawlerController, RidiCrawlerController],
  providers: [CrawlerService, RidiCrawlerService, KakaopageService, ],
})
export class CrawlerModule {}
