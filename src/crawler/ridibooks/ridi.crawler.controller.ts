import { Body, Controller, Get, ParseIntPipe, Post } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { ridibooks } from '../constants/ridibooks';
import { RidiCrawlerService } from './ridi.crawler.service';

@Controller('crawler/ridi')
export class RidiCrawlerController {
  constructor(private readonly crawlingService: RidiCrawlerService) {}
  //리디 웹툰

  //리디 웹소설
  @Post()
  async crawlPages(
    @Body('type') type: string,
    @Body('maxPages', ParseIntPipe) maxPages: number,
  ) {
    try {
      const url = ridibooks.ridiPage;
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();

      await this.crawlingService.login(page, url);

      const linkList = await this.crawlingService.getLinkList(
        page,
        type,
        url,
        maxPages,
      );

      //탭 갯수 지정
      let tabCount = 2;
      const tabs = await this.crawlingService.divideArray(tabCount, linkList);

      console.log(tabs);

      const posts = await this.crawlingService.crawling(
        browser,
        url,
        tabs,
        linkList,
        type,
      );

      console.log(posts[0].webContent);

      await this.crawlingService.createJsonFile(type, posts);

      await page.close();
      console.log('스크래핑 종료');
    } catch (err) {
      console.log('❌❌❌❌', err);
    }
  }

  @Post('best')
  async crawlBest20Pages(@Body('type') type: string) {
    try {
      const url = ridibooks.ridiPage;
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();

      await this.crawlingService.login(page, url);

      const linkList = await this.crawlingService.getBest20LinkList(
        page,
        type,
        url,
      );

      //탭 갯수 지정
      let tabCount = 1;
      const tabs = await this.crawlingService.divideArray(tabCount, linkList);

      console.log(tabs);

      const posts = await this.crawlingService.crawling(
        browser,
        url,
        tabs,
        linkList,
        type,
      );

      console.log(posts[0].webContent);

      await this.crawlingService.createJsonFile(type, posts);

      await page.close();
      console.log('스크래핑 종료');
    } catch (err) {
      console.log('❌❌❌❌', err);
    }
  }
}
