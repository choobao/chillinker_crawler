import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Page } from 'puppeteer';
import fs from 'fs';
import {
  mrblue_login_page_url,
  mrblue_main_url,
  mrblue_webnovel_allgenre_sortbyreview_frontpart,
  mrblue_webnovel_allgenre_sortbyreview_backpart,
  mrblue_webnovel_daily_toprank_120,
  mrblue_webtoon_daily_toprank_120,
  mrblue_webtoon_allgenre_sortbyreview_frontpart,
  mrblue_webtoon_allgenre_sortbyreview_backpart,
} from './path';
import { setTimeout } from 'timers/promises';

@Injectable()
export class MrblueService {
  constructor(private readonly configService: ConfigService) {}
  //웹소설 크롤링
  async crawlWebnovels() {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1280,960'],
      }); // 브라우저 띄움

      const page = await browser.newPage(); // 페이지 창 생성
      await page.setViewport({ width: 1280, height: 960 });

      await this.login(page);
      let currentPage = 1;
      let data: any[] = [];
      while (currentPage < 2) {
        const newdata = await this.getWebnovels(page, currentPage);
        data = [...data, ...newdata];
        currentPage += 1;
      }
      await browser.close();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getWebnovels(page: Page, currentPage: number) {
    try {
      await page.goto(
        mrblue_webnovel_allgenre_sortbyreview_frontpart +
          currentPage +
          mrblue_webnovel_allgenre_sortbyreview_backpart,
        {
          waitUntil: 'networkidle2',
        },
      );

      const linkList = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll('#listBox > div > div > ul> li'),
        );
        return items.map((item) => {
          const link = item.querySelector('div.img > a')?.getAttribute('href');
          return link;
        });
      });

      let data: any[] = [];

      for (let link of linkList) {
        const realUrl = `${mrblue_main_url}${link}`;
        await page.goto(realUrl, { waitUntil: 'networkidle2' });

        const html = await page.content();
        const reviews = await this.getReviews(page);

        await page.waitForSelector('#contents > div > div > div.detail-con', {
          visible: true,
        });
        const newData = await page.evaluate((realUrl) => {
          const item = document.querySelector(
            '#contents > div > div > div.detail-con',
          );

          const platform = { mrblue: realUrl };
          const img = item
            .querySelector('div.info-box > div.img-box > p > img')
            ?.getAttribute('src');
          const contentType = '웹소설';
          const genre = item.querySelector(
            'div.info-box > div.txt-info > div.genre-info > span:nth-child(1) > a:nth-child(3)',
          )?.textContent; //장르가 '연재'로 들어오면 그땐 장르디테일을 대신 써야함...
          const genreDetail = item.querySelector(
            'div.info-box > div.txt-info > div.genre-info > span:nth-child(1) > a:nth-child(5)',
          )?.textContent;
          const title = item.querySelector(
            'div.info-box > div.txt-info > p',
          )?.textContent;
          const author = item
            .querySelector('div.info-box > div.txt-info > div.txt > p')
            ?.textContent.replace('글 ', '글:')
            .replace('삽화 ', '/삽화:');
          const ageLimit = item.querySelector(
            'div.info-box > div.txt-info > div.txt > p:nth-child(2) > span:nth-child(1)',
          ).textContent;
          const isAdult = ageLimit === '19세 이용가' ? 1 : 0;
          const publishDate = item.querySelector(
            'div.info-box > div.txt-info > div.txt > p.mt10 > span:nth-child(1)',
          )?.textContent;
          const dsc = item
            .querySelector('div > div.txt-box')
            ?.textContent.replace(' ', '');
          const keywordList = Array.from(
            document.querySelectorAll(
              '#contents > div > div > div.detail-con > ul.additional-info-keyword > li > a.keyword',
            ),
          ).map((keyword) => keyword.textContent);

          return {
            platform,
            img,
            contentType,
            genre,
            genreDetail,
            title,
            author,
            ageLimit,
            isAdult,
            publishDate,
            dsc,
            keywordList,
          };
        }, realUrl);
        data.push({ ...newData, reviews });
      }
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  //웹소설 랭킹 크롤링
  async webnovelRank() {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1280,960'],
      }); // 브라우저 띄움

      const page = await browser.newPage(); // 페이지 창 생성
      await page.setViewport({ width: 1280, height: 960 });

      await this.login(page);

      const data = await this.getWebnovelRank(page);
      await browser.close();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getWebnovelRank(page: Page) {
    try {
      let data: any[] = [];
      await page.goto(mrblue_webnovel_daily_toprank_120, {
        waitUntil: 'networkidle2',
      });

      const firstTo5th = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll(
            '#contents > div.cover-section.best100 > div > div > div.list-box.top-rank > ul > li',
          ),
        );
        return items.map((item) => {
          return {
            rank: item.querySelector('p')?.textContent,
            link: item.querySelector('div.img > a')?.getAttribute('href'),
          };
        });
      });
      data = [...data, ...firstTo5th];

      const sixthTo20th = await page.evaluate(() => {
        let items = Array.from(
          document.querySelectorAll(
            '#contents > div:nth-child(2) > div > div > ul > li',
          ),
        );
        items = items.filter((_, index) => {
          return index < 15;
        });

        return items.map((item) => {
          return {
            rank: item.querySelector('p')?.textContent,
            link: item.querySelector('div.img > a')?.getAttribute('href'),
          };
        });
      });
      data = [...data, ...sixthTo20th];

      let results: any[] = [];

      for (let work of data) {
        const realUrl = mrblue_main_url + work.link;
        await page.goto(realUrl, { waitUntil: 'networkidle2' });
        const html = await page.content();
        const reviews = await this.getReviews(page);

        await page.waitForSelector('#contents > div > div > div.detail-con', {
          visible: true,
        });

        const newData = await page.evaluate(
          async (realUrl, rank) => {
            const item = document.querySelector(
              '#contents > div > div > div.detail-con',
            );
            const platform = { mrblue: realUrl };
            const img = item
              .querySelector('div.info-box > div.img-box > p > img')
              ?.getAttribute('src');
            const contentType = '웹소설';
            const genre = item.querySelector(
              'div.info-box > div.txt-info > div.genre-info > span:nth-child(1) > a:nth-child(3)',
            )?.textContent; //장르가 '연재'로 들어오면 그땐 장르디테일을 대신 써야함...
            const genreDetail = item.querySelector(
              'div.info-box > div.txt-info > div.genre-info > span:nth-child(1) > a:nth-child(5)',
            )?.textContent;
            const title = item.querySelector(
              'div.info-box > div.txt-info > p',
            )?.textContent;
            const author = item
              .querySelector('div.info-box > div.txt-info > div.txt > p')
              ?.textContent.replace('글 ', '글:')
              .replace('삽화 ', '/삽화:');
            const ageLimit = item.querySelector(
              'div.info-box > div.txt-info > div.txt > p:nth-child(2) > span:nth-child(1)',
            ).textContent;
            const isAdult = ageLimit === '19세 이용가' ? 1 : 0;
            const publishDate = item.querySelector(
              'div.info-box > div.txt-info > div.txt > p.mt10 > span:nth-child(1)',
            )?.textContent;
            const dsc = item
              .querySelector('div > div.txt-box')
              ?.textContent.replace(' ', '');
            const keywordList = Array.from(
              document.querySelectorAll(
                '#contents > div > div > div.detail-con > ul.additional-info-keyword > li > a.keyword',
              ),
            ).map((keyword) => keyword.textContent);

            return {
              rank: { mrblue: rank },
              platform,
              img,
              contentType,
              genre,
              genreDetail,
              title,
              author,
              ageLimit,
              isAdult,
              publishDate,
              dsc,
              keywordList,
            };
          },
          realUrl,
          work.rank,
        );
        results.push({ ...newData, reviews });
      }

      return results;
    } catch (err) {
      throw new Error(err);
    }
  }

  //웹툰 크롤링
  async crawlWebtoons() {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1280,960'],
      }); // 브라우저 띄움

      const page = await browser.newPage(); // 페이지 창 생성
      await page.setViewport({ width: 1280, height: 960 });

      await this.login(page);
      let currentPage = 1;
      let data: any[] = [];

      while (currentPage < 2) {
        const newdata = await this.getWebtoons(page, currentPage);
        data = [...data, ...newdata];
        currentPage++;
      }
      await browser.close();
      return data;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getWebtoons(page: Page, currentPage: number) {
    try {
      await page.goto(
        mrblue_webtoon_allgenre_sortbyreview_frontpart +
          currentPage +
          mrblue_webtoon_allgenre_sortbyreview_backpart,
        {
          waitUntil: 'networkidle2',
        },
      );

      const linkList = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll('#listBox > div > div > ul > li'),
        );
        return items.map((item) => {
          const link = item.querySelector('div.img > a')?.getAttribute('href');
          return link;
        });
      });

      let data: any[] = [];

      for (let link of linkList) {
        const realUrl = `${mrblue_main_url}${link}`;
        await page.goto(realUrl, { waitUntil: 'networkidle2' });

        const html = await page.content();
        const reviews = await this.getReviews(page);
        await page.waitForSelector('#contents', { visible: true });

        const newData = await page.evaluate((realUrl) => {
          const item = document.querySelector('#contents');

          const platform = { mrblue: realUrl };
          const img = item
            .querySelector(
              'div.cover-section.webtoon-detail > div.img-box > p > img',
            )
            ?.getAttribute('src')
            .replace('/detail_original.jpg', '/cover_w480.jpg');
          const contentType = '웹툰';
          const genre = item.querySelector(
            'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.info > span:nth-child(1) > a',
          )?.textContent;
          const title = item.querySelector(
            'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > p',
          )?.textContent;
          const author = item
            .querySelector(
              'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.txt > p',
            )
            .textContent.replace('그림/글 ', '그림/글:')
            .replace('그림 ', '그림:')
            .replace('글 ', ' 글:');
          const ageLimit = item.querySelector(
            'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.txt > p:nth-child(2) > span:nth-child(1)',
          ).textContent;
          const isAdult = ageLimit === '19세 이용가' ? 1 : 0;
          const publishDate = item.querySelector(
            '#volList > li:nth-child(1) > div.vol-info > p.info-summary > span:nth-child(1)',
          )?.textContent;
          const dsc = item.querySelector(
            'div:nth-child(2) > div > div.detail-con > div> div.txt-box',
          )?.textContent;
          const keywordList = Array.from(
            document.querySelectorAll(
              '#contents > div:nth-child(2) > div > div.detail-con > ul.additional-info-keyword > li > a.keyword',
            ),
          ).map((keyword) => keyword.textContent);

          return {
            platform,
            img,
            contentType,
            genre,
            title,
            author,
            ageLimit,
            isAdult,
            publishDate,
            dsc,
            keywordList,
          };
        }, realUrl);
        data.push({ ...newData, reviews });
      }
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  //웹툰 랭킹 크롤링
  async webtoonRank() {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--window-size=1280,960'],
      }); // 브라우저 띄움

      const page = await browser.newPage(); // 페이지 창 생성
      await page.setViewport({ width: 1280, height: 960 });

      await this.login(page);

      const data = await this.getWebtoonRank(page);
      await browser.close();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getWebtoonRank(page: Page) {
    try {
      let data: any[] = [];
      await page.goto(mrblue_webtoon_daily_toprank_120, {
        waitUntil: 'networkidle2',
      });

      const firstTo5th = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll(
            '#contents > div:nth-child(1) > div > div > div.list-box.top-rank > ul > li',
          ),
        );
        return items.map((item) => {
          return {
            rank: item.querySelector('p')?.textContent,
            link: item.querySelector('div.img > a')?.getAttribute('href'),
          };
        });
      });
      data = [...data, ...firstTo5th];

      const sixthTo20th = await page.evaluate(() => {
        let items = Array.from(
          document.querySelectorAll(
            '#contents > div:nth-child(2) > div > div > ul > li',
          ),
        );
        items = items.filter((_, index) => {
          return index < 15;
        });
        return items.map((item) => {
          return {
            rank: item.querySelector('p')?.textContent,
            link: item.querySelector('div.img > a').getAttribute('href'),
          };
        });
      });
      data = [...data, ...sixthTo20th];
      let results: any[] = [];
      for (let work of data) {
        const realUrl = mrblue_main_url + work.link;
        await page.goto(realUrl, { waitUntil: 'networkidle2' });
        const html = await page.content();
        const reviews = await this.getReviews(page);
        await page.waitForSelector('#contents', { visible: true });

        const newData = await page.evaluate(
          async (realUrl, rank) => {
            const item = document.querySelector('#contents');
            const platform = { mrblue: realUrl };
            const img = item
              .querySelector(
                'div.cover-section.webtoon-detail > div.img-box > p > img',
              )
              ?.getAttribute('src')
              .replace('/detail_original.jpg', '/cover_w480.jpg');
            const contentType = '웹툰';
            const genre = item.querySelector(
              'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.info > span:nth-child(1) > a',
            )?.textContent;
            const title = item.querySelector(
              'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > p',
            )?.textContent;
            const author = item
              .querySelector(
                'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.txt > p',
              )
              .textContent.replace('그림/글 ', '그림/글:')
              .replace('그림 ', '그림:')
              .replace('글 ', ' 글:');
            const ageLimit = item.querySelector(
              'div.cover-section.webtoon-detail > div.cover-section-inner.detail-con > div > div > div.txt > p:nth-child(2) > span:nth-child(1)',
            ).textContent;
            const isAdult = ageLimit === '19세 이용가' ? 1 : 0;
            const publishDate = item.querySelector(
              '#volList > li:nth-child(1) > div.vol-info > p.info-summary > span:nth-child(1)',
            )?.textContent;
            const dsc = item.querySelector(
              'div:nth-child(2) > div > div.detail-con > div> div.txt-box',
            )?.textContent;
            const keywordList = Array.from(
              document.querySelectorAll(
                '#contents > div:nth-child(2) > div > div.detail-con > ul.additional-info-keyword > li > a.keyword',
              ),
            ).map((keyword) => keyword.textContent);

            return {
              rank: { mrblue: rank },
              platform,
              img,
              contentType,
              genre,
              title,
              author,
              ageLimit,
              isAdult,
              publishDate,
              dsc,
              keywordList,
            };
          },
          realUrl,
          work.rank,
        );
        results.push({ ...newData, reviews });
      }

      return results;
    } catch (err) {
      throw new Error(err);
    }
  }

  //로그인
  async login(page: Page) {
    try {
      const mbEmail = this.configService.get<string>('MRBLUE_EMAIL');
      const mbPassword = this.configService.get<string>('MRBLUE_PASSWORD');
      await page.goto(mrblue_login_page_url, {
        waitUntil: 'networkidle2',
        timeout: 50000,
      }); //mrblue로그인 페이지로 이동

      await page.type('#pu-page-id', mbEmail); //이메일 입력창에 이메일 입력
      await page.type('#pu-page-pw', mbPassword); //비밀번호 입력창에 비밀번호 입력
      await page.click('#loginPageForm > div.in-value > a'); // 로그인 버튼 클릭
      await page.waitForNavigation(); //이거 없으면 로그인이 안됨;;
    } catch (err) {
      console.log('로그인 실패!');
      throw new Error(`${err}`);
    }
  }

  //리뷰 가져오기
  async getReviews(page: Page) {
    try {
      let reviewList: any[] = [];
      if (
        (await page.$('#reviewContainer')) === null ||
        (await page.$('#reviewBox > li.no-review'))
      ) {
        return reviewList;
      }
      let maxPageCount = 0;
      try {
        maxPageCount = await page.$eval(
          'div#reviewPaging > a.btn-last',
          (el) => +el.getAttribute('data-page'),
        );
      } catch (err) {
        console.error(err);
        maxPageCount = 1;
      }

      if (maxPageCount >= 3) {
        for (let i = 1; i <= 3; i++) {
          if (reviewList.length > 30) {
            break;
          }
          const button = 'div#reviewPaging > a.btn-next';
          await setTimeout(1000);
          await page.click(button);
          const reviews = await page.evaluate(() => {
            const items = Array.from(
              document.querySelectorAll('#reviewBox > li'),
            );
            return items.map((item) => {
              return {
                platform: 'mrblue',
                writerId: item.querySelector('p > strong')?.textContent,
                createdAt: item.querySelector('p.star-box > span.date')
                  ?.textContent,
                Content: item.querySelector('p.txt')?.textContent,
                likeCount: item.querySelector('a > span.cnt')?.textContent,
              };
            });
          });
          reviewList = reviewList.concat(reviews);
        }
      } else if (maxPageCount < 3) {
        for (let i = 1; i <= maxPageCount; i++) {
          if (reviewList.length > 30) {
            break;
          }
          try {
            const button = 'div#reviewPaging > a.btn-next';
            await setTimeout(1000);
            await page.click(button);
          } catch (err) {
            console.error(err);
          }
          const reviews = await page.evaluate(() => {
            const items = Array.from(
              document.querySelectorAll('#reviewBox > li'),
            );
            return items.map((item) => {
              return {
                platform: 'mrblue',
                writerId: item.querySelector('p > strong')?.textContent,
                createdAt: item.querySelector('p.star-box > span.date')
                  ?.textContent,
                content: item.querySelector('p.txt')?.textContent,
                likeCount: item.querySelector('a > span.cnt')?.textContent,
              };
            });
          });
          reviewList = reviewList.concat(reviews);
        }
      }
      return reviewList;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
}
