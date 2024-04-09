import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { PReviews } from '../entities/platform.reviews.entity';
import { WebContents } from '../entities/webContents.entity';
import { ContentType } from '../type/webContent.type';

@Injectable()
export class RidiDbService {
  constructor(
    @InjectRepository(WebContents)
    private readonly webContentRepository: Repository<WebContents>,
    @InjectRepository(PReviews)
    private readonly PReviewsRepository: Repository<PReviews>,
  ) {}

  async findBestWebContents(platform: string, type: ContentType) {
    try {
      const bestWebContents = await this.webContentRepository
        .createQueryBuilder('webContents')
        .leftJoinAndSelect('webContents.cReviews', 'review')
        .where(
          `JSON_EXTRACT(webContents.platform, '$.${platform}') IS NOT NULL`,
        )
        .andWhere('webContents.contentType = :type', { type })
        .andWhere('webContents.rank IS NOT NULL')
        .groupBy('webContents.id')
        .select(['webContents.id', 'webContents.category', 'webContents.title'])
        .addSelect('COUNT(review.id)', 'reviewCount')
        .addSelect(`JSON_EXTRACT(webContents.rank, '$.${platform}')`, 'ranking') // 플랫폼 별 랭킹
        .orderBy('ranking', 'ASC') // ranking에 따라 정렬
        .getRawMany();

      return bestWebContents;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async readJson(path: string, files: string[]) {
    const postPromises = files.map(async (file) => {
      const data = await fs.readFile(`${path}/${file}`);
      return JSON.parse(data.toString());
    });

    return Promise.all(postPromises);
  }

  async saveWebNoveltToDb(datas: any) {
    console.log('통과');
    for (let i = 0; i < datas.length; i++) {
      const { url, rank, isAdult } = datas[i];
      const { title, dsc, img, author, keyword, genre, pubDate } =
        datas[i].webContent[0];
      const platformName = 'Ridi';

      const platform = {}; // 빈 객체 생성
      platform[platformName] = url; // 동적 속성 할당

      const datePart = pubDate.split('\n')[0];
      const [year, month, day] = datePart.split('.');
      const data = new Date(`${year}-${month}-${day}`);

      const rankNum = +rank;
      const rrank = {}; // 빈 객체 생성
      rrank[platformName] = rankNum;

      // console.log(datas[8].webContent[0].dsc[0]);

      await this.webContentRepository.save({
        contentType: ContentType.WEBNOVEL,
        rank: rrank,
        title: title,
        desc: dsc[0],
        image: img,
        author: author[0],
        keyword: keyword[0],
        category: genre[0],
        platform,
        pubDate: data,
      });
    }

    return console.log('저장완료');
  }

  async saveWebContentToDb(datas: any) {
    console.log('통과');
    for (let i = 0; i < datas.length; i++) {
      const { url, rank, isAdult } = datas[i];
      const { title, dsc, img, author, keyword, genre, pubDate } =
        datas[i].webContent[0];
      const platformName = 'Ridi';

      const platform = {}; // 빈 객체 생성
      platform[platformName] = url; // 동적 속성 할당

      const datePart = pubDate.split('\n')[0];
      const [year, month, day] = datePart.split('.');
      const data = new Date(`${year}-${month}-${day}`);

      const rankNum = +rank;
      const rrank = {}; // 빈 객체 생성
      rrank[platformName] = rankNum;

      // console.log(datas[8].webContent[0].dsc[0]);

      await this.webContentRepository.save({
        contentType: ContentType.WEBNOVEL,
        rank: rrank,
        title: title,
        desc: dsc[0],
        image: img,
        author: author[0],
        keyword: keyword[0],
        category: genre[0],
        platform,
        pubDate: data,
      });
    }
  }
  async saveReviewToDb(datas: any) {
    console.log('통과');
    for (let i = 0; i < datas.length; i++) {
      const { contentTitle, scrapDate } = datas[i];

      const webContentId = await this.webContentRepository.findOne({
        where: { title: contentTitle },
      });

      console.log(webContentId.id);
      console.log(datas[0].reviewsData[0]);
      for (let j = 0; j < datas[i].reviewsData.length; j++) {
        const { writer, content, likeCount, date } = datas[i].reviewsData[j];

        await this.PReviewsRepository.save({
          content: content,
          likeCount: likeCount,
          writer: writer,
          date: date,
          webContentId: webContentId.id,
        });
      }
    }

    return console.log('저장완료');
  }
}
