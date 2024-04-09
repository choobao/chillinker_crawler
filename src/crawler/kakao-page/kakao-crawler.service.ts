import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';
// function delay(time) {
//   return new Promise(function (resolve) {
//     setTimeout(resolve, time);
//   });
// }

@Injectable()
export class KakaoCrawlerService {
  async getPopularNovels(): Promise<any> {
    try {
      const browser = await puppeteer.launch({
        headless: false, // 브라우저 실행
        userDataDir: './tmp',
      });
      console.log('페이지로 이동');

      const page = await browser.newPage(); // 새 페이지 열어
      const url = 'https://page.kakao.com/menu/10011/screen/94'; // 카카페 웹소설 실시간 랭킹 300 url에 접속

      await page.goto(url, { waitUntil: 'networkidle0' }); //네트워크 연결이 최소 2개 이하로 활성화된 상태에서 최소 500 밀리초 동안 아무런 네트워크 활동이 없을 때까지 페이지 로딩을 기다린다

      let novelsList: any[] = []; // novel_item 담을 빈 배열
      const novel_item =
        '#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div:nth-child(2) > div > div.flex.w-full.grow.flex-col > div > div > div > div';
      await page.waitForSelector(novel_item);
      console.log(await page.$(novel_item));

      let lastHeight = await page.evaluate('document.body.scrollHeight');

      while (true) {
        const newNovels = [];
        const tmp = await page.$$(novel_item);
        for (const t of tmp) {
          const url = await t.$eval('a', (el) => el.getAttribute('href'));
          newNovels.push({ url });
        }
        novelsList.push(...newNovels);

        // 이전 스크롤 위치 저장
        const previousHeight = await page.evaluate(
          'document.body.scrollHeight',
        );

        // 스크롤 다운
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

        // 페이지가 새로운 콘텐츠를 로드할 때까지 기다림
        await page.waitForFunction(
          `document.body.scrollHeight > ${previousHeight}`,
        );
        await setTimeout(2000);

        if (novelsList.length === 30) {
          break; // 더 이상 새로운 타이틀이 수집되지 않으면 반복을 종료
        }
      }

      return novelsList;
    } catch (error) {
      // await browser.close();
      throw new Error(
        `카카오 페이지에서 데이터를 가져오지 못했습니다: ${error}`,
      );
    } finally {
      // await browser.close();
    }
  }
}
