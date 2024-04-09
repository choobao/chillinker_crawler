import { Controller, Get } from '@nestjs/common';
import { promises as fs } from 'fs';
import { RidiDbService } from './ridi.db.service';

@Controller('db/ridi')
export class RidiDbController {
  constructor(private readonly dbService: RidiDbService) {}

  @Get('webContent')
  async saveWebContentToDb() {
    const path = './posts';
    const posts = await fs.readdir(path);

    const datas = await this.dbService.readJson(path, posts);

    await this.dbService.saveWebContentToDb(datas);
  }

  @Get('webNovel')
  async saveWebNovelToDb() {
    const path = './webNovels';
    const posts = await fs.readdir(path);

    const datas = await this.dbService.readJson(path, posts);

    await this.dbService.saveWebNoveltToDb(datas);
  }

  @Get('review')
  async saveReviewtToDb() {
    const path = './reviews';
    const posts = await fs.readdir(path);

    const datas = await this.dbService.readJson(path, posts);

    await this.dbService.saveReviewToDb(datas);
  }
}
