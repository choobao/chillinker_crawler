// import { Injectable } from '@nestjs/common';
// import puppeteer from 'puppeteer';
// import { setTimeout } from 'timers/promises';

// @Injectable()
// export class KakaoCrawlerService {
//   async getPopularNovels(): Promise<any> {
//     try {
//       const browser = await puppeteer.launch({
//         headless: false, // 브라우저 실행
//       });
//       console.log('페이지로 이동');

//       const page = await browser.newPage(); // 새 페이지 열어
//       const url = 'https://page.kakao.com/menu/10011/screen/94'; // 카카페 웹소설 실시간 랭킹 300 url에 접속

//       await page.goto(url, { waitUntil: 'networkidle0' }); //네트워크 연결이 최소 2개 이하로 활성화된 상태에서 최소 500 밀리초 동안 아무런 네트워크 활동이 없을 때까지 페이지 로딩을 기다린다
//       // await page.waitForNavigation({ waitUntil: 'networkidle2' });
//       let novelsList: any[] = []; // novel_item 담을 빈 배열

//       const novel_item =
// '#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div:nth-child(3) > div > div.flex.w-full.grow.flex-col > div > div > div > div:nth-child > div > a';

//       // while (novelsList.length < 20) {
//       //   await page.evaluate(() => {
//       //     // 페이지 스크롤 조작
//       //     window.scrollBy(0, window.innerHeight);
//       //   });
//       // let button: string | null = null;

//       // while (!button || novelsList.length < 20) {
//       //   await page.evaluate(() => {
//       //     // 페이지 스크롤 조작
//       //     window.scrollBy(0, window.innerHeight);
//       //   });

//       //  setTimeout(2000);

//         novelsList = await page.$$eval(
//           // 웹소설 목록 수집해서 리스트에 넣음
//           novel_item,
//           (els) =>
//             els.map((el) => ({
//               url: el.getAttribute('href'), // 웹소설 목록의 링크 가져옴
//             })),
//         );

//         // 버튼 값 가져오기
//         // button = await page.evaluate(() => {
//         //   const buttonElement = document.querySelector(
//         //     '#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div:nth-child(3) > div > div.flex.w-full.grow.flex-col > div > div > div > div:nth-child(12) > div > a > div',
//         //   );
//         //   return buttonElement?.innerHTML;
//         // });
//       }

//       // await page.waitForSelector(
//       //   // 스크롤 끝날때까지 기다림
//       //   '#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div:nth-child(3) > div > div.flex.w-full.grow.flex-col > div > div > div > div:nth-child(300) > div > a > div > div.jsx-3256825605.h-76pxr.w-full.space-y-4pxr.pt-8pxr.pr-8pxr.pb-4pxr > div.flex.w-68pxr.rounded-[5px].px-4pxr.under-320-view:w-56pxr.bg-el-20 > div.font-small2-bold.flex-1.text-el-60',
//       //   { timeout: 10000 },
//       // );

//       return novelsList;

//       // await page.evaluate(() => {
//       //   // 페이지 스크롤, 새로운 목록 가져옴
//       //   const button = document.querySelector(
//       //     '#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div:nth-child(3) > div > div.flex.w-full.grow.flex-col > div > div > div > div:nth-child(12) > div > a > div',
//       //   )?.innerHTML;
//       //   console.log(button);

//       //   const scrollStep = () => {
//       //     let totalHeight = 0;
//       //     const distance = 100;
//       //     window.scrollBy(0, distance);
//       //     totalHeight += distance;
//       //     console.log('스크롤중');
//       //     if (+button == 300) {
//       //       console.log('스크롤 끝');
//       //       return;
//       //     }
//       //     setTimeout(scrollStep, 100);
//       //   };
//       //   scrollStep();
//       // });
//       // await new Promise((resolve, reject) => {
//       //   let totalHeight = 0;
//       //   const distance = 100;
//       //   const timer = setInterval(() => {
//       //     const scrollHeight = document.documentElement.scrollHeight;
//       //     window.scrollBy(0, distance);
//       //     totalHeight += distance;

//       //     if (totalHeight >= scrollHeight) {
//       //       clearInterval(timer);
//       //       resolve(true);
//       //     }
//       //   }, 100);
//       // });

//       console.log('스크롤 끝');

//       // console.log(novelsList);

//       //for (let i = 0; i < maxScrolls; i++) {
//       // 무한스크롤 형식의 페이지이기 때문에 페이지 최하단으로 스크롤하는 로직

//       // await page.waitForTimeout(2000);
//       // await new Promise((page) => setTimeout(page, 2000)); // 스크롤 후 새 작품들이 로딩될때까지 기다림

//       // 새로 로딩된 컨텐츠에서 링크 가져옴
//       //   const newNovels = await page.evaluate(() => {
//       //     const novel_item =
//       //       'div.flex.grow.flex-col > div > div > div > div > div > a';
//       //     const novels = Array.from(document.querySelectorAll(novel_item));
//       //     return novels.map((novel) => {
//       //       // const title = novel.getAttribute('aria-label');
//       //       // const thumbnail = novel.querySelector('img')?.getAttribute('src');
//       //       // const description = novel
//       //       //   .querySelector('div > div > a')
//       //       //   ?.textContent.trim();
//       //       // return { title, thumbnail, description };
//       //       return {
//       //         url: 'https://page.kakao.com' + novel.getAttribute('href'),
//       //       };
//       //     });
//       //   });
//       //   // 노벨리스트에 로딩된 새 소설 추가
//       //  // novelsList = [...novelsList, ...newNovels];
//       // }

//       // // 노벨리스트에 가져온 소설 데이터 추가하고 중복 제거 후 리턴
//       // return novelsList.filter(
//       //   (novel, index) =>
//       //     novelsList.findIndex((n) => n.title === novel.title) === index,
//       // );
//       // }
//       // console.log('작품: ', novelsList);
//     } catch (error) {
//       // await browser.close();
//       throw new Error(
//         `카카오 페이지에서 데이터를 가져오지 못했습니다: ${error}`,
//       );
//     } finally {
//       // await browser.close();
//     }
//   }
// }
