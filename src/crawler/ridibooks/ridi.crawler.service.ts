import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { ridibooks } from '../constants/ridibooks';
import { Cluster } from 'puppeteer-cluster';
import { Cron } from '@nestjs/schedule';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

dotenv.config();

@Injectable()
export class RidiCrawlerService {
  async login(page: any, url: string) {
    const { pageBtn, submitBtn, textCursor1, textCursor2 } = ridibooks.login;

    await page.goto(url);
    await page.waitForSelector(pageBtn);
    await page.click(pageBtn);
    await page.waitForSelector(submitBtn);

    await page.click(textCursor1);
    await page.keyboard.type(process.env.RIDI_ID, { delay: 100 });
    await page.click(textCursor2);
    await page.keyboard.type(process.env.RIDI_PW, { delay: 100 });

    await page.click(submitBtn);
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    if (page.url() === url) return true;
  }

  async getLinkList(page: any, type: string, url: string, maxPages: number) {
    let currentPage = 1;
    let linkList: any[] = [];

    const result = type === 'webNovels' ? 'romance_serial' : 'webtoon';

    while (currentPage <= maxPages) {
      const newUrl = `${url}/bestsellers/${result}?page=${currentPage}&order=daily`;
      console.log(`Start Crawling: ${newUrl}`);
      await page.goto(newUrl, { waitUntil: 'networkidle0' });

      await this.scrolling(page);

      if (type === 'webNovels') {
        const newLinks = await page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll(
              '#__next > main > section > ul.fig-1w8zspb > li',
            ),
          ).slice(0);

          return items.map((item) => {
            const link = item.querySelector('a')?.getAttribute('href');
            let rank = item.querySelector('div > div.fig-9njjsy')?.innerHTML;

            if (+rank > 20) {
              rank = null;
            }

            return { link, rank };
          });
        });

        linkList.push(...newLinks);
        currentPage += 1;
      } else {
        const newLinks = await page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll(
              '#__next > main > section > ul.fig-1w8zspb > li',
            ),
          );
          return items.map((item) => {
            const link = item.querySelector('a')?.getAttribute('href');
            let rank = item.querySelector('div > div.fig-9njjsy')?.innerHTML;

            if (+rank > 20) {
              rank = null;
            }

            return { link, rank };
          });
        });

        linkList.push(...newLinks);
        currentPage += 1;
      }
    }
    return linkList;
  }

  async getBest20LinkList(page: any, type: string, url: string) {
    let currentPage = 1;
    let linkList: any[] = [];

    const result = type === 'webNovels' ? 'romance_serial' : 'webtoon';

    const newUrl = `${url}/bestsellers/${result}?page=${currentPage}&order=daily`;
    console.log(`Start Crawling: ${newUrl}`);
    await page.goto(newUrl, { waitUntil: 'networkidle0' });

    await this.scrolling(page);

    if (type === 'webNovels') {
      const newLinks = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll(
            '#__next > main > section > ul.fig-1w8zspb > li',
          ),
        ).slice(1, 21);

        return items.map((item) => {
          const link = item.querySelector('a')?.getAttribute('href');
          let rank = item.querySelector('div > div.fig-9njjsy')?.innerHTML;

          return { link, rank };
        });
      });

      linkList.push(...newLinks);
      currentPage += 1;
    } else {
      const newLinks = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll(
            '#__next > main > section > ul.fig-1w8zspb > li',
          ),
        ).slice(0, 20);
        return items.map((item) => {
          const link = item.querySelector('a')?.getAttribute('href');
          let rank = item.querySelector('div > div.fig-9njjsy')?.innerHTML;

          return { link, rank };
        });
      });

      linkList.push(...newLinks);
      currentPage += 1;
    }
    return linkList;
  }

  async divideArray(tabCount: number, linkList: any[]) {
    let tabs = new Array(tabCount);
    for (let i = 0; i < tabs.length; i++) {
      tabs[i] = [];
    }
    await Promise.all(
      linkList.map(async (postsData, index) => {
        console.log(postsData);
        tabs[index % tabCount].push(postsData);
      }),
    );
    return tabs;
  }

  async crawling(
    browser: any,
    url: string,
    tabs: any[],
    linkList: any[],
    type: string,
  ) {
    const posts = [];

    await Promise.all(
      tabs.map(async (linkList) => {
        const postPage = await browser.newPage();
        // const currentTabLinkList = linkList[linkList];
        for (const link of linkList) {
          // const startTime = new Date().getTime();
          const newUrl = `${url}${link.link}`;
          console.log(`Start Crawling: ${newUrl}`);
          postPage.goto(newUrl, { timeout: 65000 });

          const webContentAndReview = await this.scrapPostAndReview(
            +link.rank,
            postPage,
            type,
          );

          posts.push(webContentAndReview);
        }
      }),
    );

    return posts;
  }

  async scrapPostAndReview(rank: any, page: any, type: string) {
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.waitForSelector(
        'div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img',
      );

      const url = page.url();
      const webContent = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll('#page_detail > div > div > section'),
        );

        return items.map((item) => {
          return {
            // isAdult: item.querySelector(
            //   '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > span',
            // )
            //   ? true
            //   : false,
            title: item.querySelector(
              '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h1',
            )?.textContent,
            img: item
              .querySelector(
                'div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img',
              )
              ?.getAttribute('src'),
            // score: item.querySelector(
            //   '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(3) > p > span > span.StarRate_Score',
            // )?.textContent,
            scoreParticipant: item.querySelector(
              '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(3) > p > span > span.StarRate_ParticipantCount',
            ).textContent,
            // userLikes: item.querySelector(
            //   '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_preference > button > span > span.button_text.js_preference_count',
            // )?.textContent,
            // status: item.querySelector(
            //   '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete',
            // )?.textContent,
            pubDate: item
              .querySelector(
                '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.Header_Metadata_Block > ul:nth-child(2) > li.Header_Metadata_Item.book_info.published_date_info > ul > li',
              )
              ?.textContent.trim(),
            genre: (() => {
              const genreList = Array.from(
                document.querySelectorAll(
                  '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p > a',
                ),
              );
              const genres = [];
              Promise.all(
                genreList.map((item) => {
                  const genre = item?.textContent;
                  genres.push(genre);
                }),
              );
              const getGenres = new Set(genres);
              return [...getGenres];
            })(),
            keyword: (() => {
              const keywordList = Array.from(
                document.querySelectorAll(
                  '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_box_module.detail_keyword.js_detail_keyword_module > ul > li',
                ),
              );
              console.log(keywordList);
              const keywords = [];

              Promise.all(
                keywordList.map((item) => {
                  const keyword =
                    item.querySelector('button > span')?.textContent;
                  keywords.push(keyword);
                }),
              );
              return [...keywords];
            })(),
            author: (() => {
              const authorList = Array.from(
                document.querySelectorAll(
                  '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span',
                ),
              );
              const authors = [];

              Promise.all(
                authorList.map((item) => {
                  const author = item?.textContent;
                  const modifiedAuthor = author.replace(/\s+/g, '/');
                  authors.push(modifiedAuthor);
                }),
              );
              return [...authors];
            })(),
            publish: item.querySelector(
              '#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.file_info.publisher_info > a',
            )?.textContent,
            dsc: (() => {
              const dscList = Array.from(
                document.querySelectorAll('#introduce_book'),
              );
              const dscs = [];
              Promise.all(
                dscList.map((item) => {
                  const dsc = item.querySelector('p')?.textContent;
                  dscs.push(dsc);
                }),
              );
              return [...dscs];
            })(),
          };
        });
      });

      let isAdult = false;
      if (type == 'webContents') {
        isAdult = webContent.some((content) => content.genre.includes('성인'));
      } else {
        isAdult = await page.$eval('.badge_adult', (element) => !!element);
      }

      const scrapDate = new Date().toLocaleDateString();

      const webContents = {
        url,
        rank,
        isAdult,
        webContent,
        scrapDate,
      };

      let contentTitle = webContent.map((content) => content.title);
      let reivewLength = webContent.map((content) => content.scoreParticipant);

      if (+reivewLength == 0) {
        return { contentTitle, webContents };
      }

      page.bringToFront();

      const reviews = await this.scrapReviews(contentTitle, page);

      return {
        contentTitle,
        webContents,
        reviews,
      };
    } catch (err) {
      console.log('❌❌❌❌', page.url(), err);
    }
  }

  async scrapReviews(contentTitle: string, page: any) {
    await this.scrolling(page);

    page.bringToFront();

    await page.click(
      '#review_list_section > div.rui_tab_and_order > ul.rui_order.js_review_list_order_wrapper > li:nth-child(2)',
    );

    for (let i = 1; i < 3; i++) {
      try {
        await page.waitForSelector(ridibooks.moreReviewBtn, {
          setTimeout: 1000,
        });
        await page.click(ridibooks.moreReviewBtn);
      } catch (error) {
        break;
      }
    }
    await this.scrolling(page);

    // await page.waitForSelector(
    //   '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
    // );

    // let reviewList = await page.$$(
    //   '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
    // );

    // console.log(reviewList.length);

    // while (reviewList.length < 30) {
    //   await page.waitForSelector(
    //     '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
    //     { waitUntil: 'networkidle0' },
    //   );

    //   await page.evaluate(async () => {
    //     await new Promise((resolve, reject) => {
    //       let totalHeight = 0;
    //       const distance = 100;
    //       const scrollStep = () => {
    //         window.scrollBy(0, distance);
    //         totalHeight += distance;
    //         const button = document.querySelector(
    //           '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
    //         );
    //         if (button) {
    //           resolve(true);
    //           return;
    //         }
    //         if (!button) {
    //           resolve(true);
    //           return;
    //         }
    //         setTimeout(scrollStep, 3000);
    //       };
    //       scrollStep();
    //     });
    //   });

    //   if (!(await page.$(ridibooks.moreReviewBtn))) {
    //     break;
    //   }

    //   await page.waitForSelector(ridibooks.moreReviewBtn);

    //   await page.click(ridibooks.moreReviewBtn);

    //   reviewList = await page.$$(
    //     '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
    //   );

    //   if (!(await page.$(ridibooks.moreReviewBtn))) {
    //     break;
    //   }

    //   console.log(reviewList.length);
    // }

    // for (let i = 1; i <= 4; i++) {
    //   try {
    //     await page.waitForSelector(ridibooks.moreReviewBtn, {
    //       setTimeout: 1000,
    //     });
    //     await page.click(ridibooks.moreReviewBtn);
    //     console.log(`${i}번클릭`);
    //   } catch (error) {}
    // }

    const reviewsData = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll(
          '#review_list_section > div.review_list_wrapper.js_review_list_wrapper.active > ul > li',
        ),
      );

      // if (items.length == 0) {
      //   return [];
      // }

      const reviewCount = Math.min(items.length, 30);

      return items.slice(0, reviewCount).map((item) => {
        return {
          writer: item.querySelector(
            'div.list_left.js_review_info_wrapper > div > p > span.reviewer_id',
          )?.textContent,
          content: item.querySelector('div.list_right.js_review_wrapper > p')
            ?.textContent,
          likeCount: item.querySelector(
            'div.list_right.js_review_wrapper > div.review_status > div > button.rui_button_white_25.like_button.js_like_button > span > span.rui_button_text > span.like_count.js_like_count',
          )?.textContent,
          isSpoiler: item.querySelector(
            'div.list_right.js_review_wrapper > div.rui_full_alert_4.spoiler_alert.js_spoiler_alert > article > p',
          )?.textContent,
          date: item
            .querySelector(
              'div.list_left.js_review_info_wrapper > div > div > div',
            )
            ?.textContent.trim(),
        };
      });
    });

    // const scrapDate = new Date().toLocaleDateString();

    // const reviews = { contentTitle, reviewsData, scrapDate };
    page.bringToFront();

    return { contentTitle, reviewsData };

    // const scrapDate = new Date().toLocaleDateString();

    // const reviews = { contentTitle, reviewsData, scrapDate };
  }

  async scrolling(page: any) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        const distance = 250;
        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(true);
          }
        }, 100);
      });
    });
  }

  async createJsonFile(type: string, posts: any) {
    try {
      const result = type === 'webNovels' ? 'webNovels' : 'posts';

      for (let i = 0; i < posts.length; i++) {
        const imageUrls = posts[i].webContents.webContent.map(
          (item) => item.img,
        );

        const fileName = imageUrls.map((url) => {
          const matchResult = url.match(/(?<=cover\/)\d+/);
          if (matchResult) {
            return `[ridibooks] ${matchResult[0]}`;
          } else {
            return null;
          }
        });

        await fs.writeFile(
          `${result}/${fileName}.json`,
          JSON.stringify(posts[i].webContents),
        );

        if (posts[i].reviews) {
          await fs.writeFile(
            `reviews/${fileName}.json`,
            JSON.stringify(posts[i].reviews),
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
