import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { load } from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { setTimeout } from 'timers/promises';
import {
  ReviewSortType,
  Type,
  kakao_api_url,
  webcontent_review_query,
  webcontent_keyword_query,
  webcontent_query,
  webcontent_ranking_daily_query,
  webContent_all_query,
} from '../constants/kakaopage';
import { ContentType } from '../../db/type/webContent.type';
import { RedisService } from '../../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { PReviews } from '../../db/entities/platform.reviews.entity';
import { WebContents } from '../../db/entities/webContents.entity';

@Injectable()
export class KakaopageService {
  constructor(
    @InjectRepository(WebContents)
    private readonly contentRepository: Repository<WebContents>,
    private readonly redisService: RedisService,
  ) {}
  // 50위까지의 랭킹 정보 요청
  async requestDailyRanking(contentType: Type) {
    try {
      const { data } = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://page.kakao.com',
        },
        url: kakao_api_url,
        data: {
          query: webcontent_ranking_daily_query,
          variables: {
            sectionId: `static-landing-Ranking-section-Landing-${contentType}-0-daily`,
            param: {
              categoryUid: contentType,
              rankingType: 'daily',
              subcategoryUid: '0',
              screenUid: null,
              page: 0,
            },
          },
        },
      });
      return data.data.staticLandingRankingSection.groups[0].items;
    } catch (err) {
      throw err;
    }
  }
  async requestWebContent(id: number, rank: number = null) {
    try {
      const { data } = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://page.kakao.com',
        },
        url: kakao_api_url,
        data: {
          query: webcontent_query,
          operationName: 'contentHomeOverview',
          variables: { seriesId: id },
        },
      });
      const webContent = data.data.contentHomeOverview.content;
      const url = `https://page.kakao.com/content/${id}`;
      const title = webContent.title;
      const desc = webContent.description;
      const image = `https:${webContent.thumbnail}`;
      const contentType =
        webContent.category === '웹툰'
          ? ContentType.WEBTOON
          : ContentType.WEBNOVEL;
      const category = webContent.subcategory;
      const author = webContent.authors;
      const isAdult = webContent.ageGrade === 'Nineteen' ? 1 : 0;
      const pubDate = new Date(webContent.startSaleDt);
      const keyword = await this.requestWebContentKeywordsAndRecommends(id);
      const reviewCount = webContent.serviceProperty.commentCount;
      let reviewList = [];
      const pageCount = Math.ceil(reviewCount / 25); // 한 페이지당 25개 리뷰 존재할때 필요한 페이지 수
      for (let i = 1; i <= pageCount; i++) {
        const reviews = await this.requestWebContentReviews(id, i);
        reviewList = reviewList.concat(reviews);
      }
      return {
        platform: { kakao: url },
        title,
        desc,
        image,
        contentType,
        category,
        author,
        isAdult,
        pubDate,
        keyword,
        pReviews: reviewList,
        rank: rank === null ? null : { kakaopage: rank },
      };
    } catch (err) {
      throw err;
    }
  }
  // 작품의 키워드와 추천작 정보 요청
  async requestWebContentKeywordsAndRecommends(id: number) {
    try {
      const { data } = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://page.kakao.com',
        },
        url: kakao_api_url,
        data: {
          query: webcontent_keyword_query,
          variables: { seriesId: id },
        },
      });
      const keywords = data.data.contentHomeInfo.about.themeKeywordList.map(
        (keyword) => keyword.title,
      );
      const recommends = data.data.contentHomeInfo.recommend.list.items; // 나중에 쓰일지도
      return keywords;
    } catch (err) {
      throw err;
    }
  }
  // 작품의 댓글 정보 요청(한 페이지당 25개씩)
  async requestWebContentReviews(
    id: number,
    page: number = 1,
    sortType: ReviewSortType = ReviewSortType.LIKE,
  ) {
    try {
      const { data } = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://page.kakao.com',
        },
        url: kakao_api_url,
        data: {
          query: webcontent_review_query,
          variables: {
            commentListInput: { seriesId: id, page, sortType },
          },
        },
      });
      const reviews = data.data.commentList.commentList.map((comment) => ({
        writer: comment.userName,
        content: comment.comment,
        likeCount: comment.likeCount,
        createdAt: new Date(comment.createDt),
      }));
      return reviews;
    } catch (err) {
      throw err;
    }
  }
  async getDailyRank_20_WebContents(contentType: Type) {
    let items = await this.requestDailyRanking(contentType);
    const ids = items.slice(0, 20).map((item) => ({
      id: +item.eventLog.eventMeta.series_id,
      rank: +item.rank,
    })); // 20위까지
    const webContentList = [];
    for (const { id, rank } of ids) {
      const webContent = await this.requestWebContent(id, rank);
      webContentList.push(webContent);
    }
    return webContentList;
  }
  async requestAllLatestWebContents(contentType: Type, page: number = 1) {
    try {
      const { data } = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://page.kakao.com',
        },
        url: kakao_api_url,
        data: {
          query: webContent_all_query,
          variables: {
            sectionId: `static-landing-Genre-section-Layout-${contentType}-0-latest-false-82`,
            param: {
              categoryUid: contentType,
              sortType: 'latest',
              isComplete: false,
              subcategoryUid: '0',
              screenUid: 82,
              page,
            },
          },
        },
      });
      return data.data.staticLandingGenreSection.groups[0].items;
    } catch (err) {
      throw err;
    }
  }
  async getAll_96_WebContents(contentType: Type, currPage: number = 0) {
    const webContentList = [];
    for (let i = 1; i <= 4; i++) {
      // 한 page당 24개 작품 존재
      const items = await this.requestAllLatestWebContents(
        contentType,
        currPage + i,
      );
      const ids = items.map((item) => item.seriesId);
      for (const id of ids) {
        const webContent = await this.requestWebContent(id);
        webContentList.push(webContent);
      }
    }
    return webContentList;
  }
  async createDtosAndSave(data: WebContents[]) {
    try {
      const createContentDtos = data.map((content) => {
        const webContent = new WebContents();
        webContent.title = content.title;
        webContent.desc = content.desc;
        webContent.image = content.image;
        webContent.author = content.author;
        webContent.category = content.category;
        webContent.isAdult = content.isAdult;
        webContent.platform = content.platform;
        webContent.pubDate = content.pubDate;
        webContent.keyword = content.keyword;
        webContent.rank = content.rank;
        webContent.contentType = content.contentType;
        webContent.pReviews = content.pReviews;
        return webContent;
      });
      // DB에 저장
      await this.contentRepository.save(createContentDtos);
    } catch (err) {
      throw err;
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createKakaopages() {
    const currPageWebnovel =
      +(await this.redisService.getValue('kakao_webnovel')) || 0;
    const currPageWebtoon =
      +(await this.redisService.getValue('kakao_webtoon')) || 0;
    try {
      const allWebnovels = await this.getAll_96_WebContents(
        Type.WEBNOVEL,
        currPageWebnovel,
      );
      await this.createDtosAndSave(allWebnovels);
      await this.redisService.save('kakao_webnovel', currPageWebnovel + 4);
      const allWebtoons = await this.getAll_96_WebContents(
        Type.WEBTOON,
        currPageWebtoon,
      );
      await this.createDtosAndSave(allWebtoons);
      await this.redisService.save('kakao_webtoon', currPageWebtoon + 4);
      const rankingWebnovels = await this.getDailyRank_20_WebContents(
        Type.WEBNOVEL,
      );
      await this.createDtosAndSave(rankingWebnovels);
      const rankingWebtoons = await this.getDailyRank_20_WebContents(
        Type.WEBTOON,
      );
      await this.createDtosAndSave(rankingWebtoons);
    } catch (err) {
      throw err;
    }
  }
}
