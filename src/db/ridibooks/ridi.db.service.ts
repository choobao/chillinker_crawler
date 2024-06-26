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

  async readJson(path: string, files: string[]) {
    const postPromises = files.map(async (file) => {
      const data = await fs.readFile(`${path}/${file}`);
      return JSON.parse(data.toString());
    });

    return Promise.all(postPromises);
  }

  async saveWebNoveltToDb(datas: any) {
    console.log('통과');
    console.log(datas[0]);
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

      const a = genre.join(', ');
      const b = keyword.join(', ');
      const c = author.join(', ');
      const d = dsc.join(', ');

      if (isAdult === false) {
        await this.webContentRepository.save({
          contentType: ContentType.WEBNOVEL,
          rank: rrank,
          title: title,
          desc: d,
          image: img,
          author: c,
          keyword: b,
          category: a,
          platform,
          pubDate: data,
        });
      } else {
        await this.webContentRepository.save({
          contentType: ContentType.WEBNOVEL,
          isAdult: 1,
          rank: rrank,
          title: title,
          desc: d,
          image: img,
          author: c,
          keyword: b,
          category: a,
          platform,
          pubDate: data,
        });
      }
    }

    return console.log('저장완료');
  }

  async saveWebContentToDb(datas: any) {
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

      const a = genre.join(', ');
      const b = keyword.join(', ');
      const c = author.join(', ');
      const d = dsc.join(', ');

      if (isAdult === false) {
        await this.webContentRepository.save({
          contentType: ContentType.WEBTOON,
          rank: rrank,
          title: title,
          desc: d,
          image: img,
          author: c,
          keyword: b,
          category: a,
          platform,
          pubDate: data,
        });
      } else {
        await this.webContentRepository.save({
          contentType: ContentType.WEBTOON,
          isAdult: 1,
          rank: rrank,
          title: title,
          desc: d,
          image: img,
          author: c,
          keyword: b,
          category: a,
          platform,
          pubDate: data,
        });
      }
    }
  }
  async saveReviewToDb(datas: any) {
    for (let i = 0; i < datas.length; i++) {
      console.log(datas.length);
      const { contentTitle, reviewsData } = datas[i];

      const webContentId = await this.webContentRepository.findOne({
        where: { title: contentTitle[0] },
      });

      for (let j = 0; j < 30; j++) {
        const { writer, content, likeCount, date } = datas[i].reviewsData[j];

        if (datas[i].reviewsData[j].isSpoiler) {
          await this.PReviewsRepository.save({
            content: content,
            likeCount: likeCount,
            isSpoiler: true,
            writer: writer,
            createdAt: date,
            webContentId: webContentId.id,
          });
        } else {
          await this.PReviewsRepository.save({
            content: content,
            likeCount: likeCount,
            writer: writer,
            createdAt: date,
            webContentId: webContentId.id,
          });
        }
      }
    }
    return console.log('저장완료');
  }
}
