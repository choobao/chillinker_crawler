import { Module } from '@nestjs/common';
import { DbService } from './db.service';
import { DbController } from './db.controller';
import { RidiDbService } from './ridibooks/ridi.db.service';
import { RidiDbController } from './ridibooks/ridi.db.controller';

@Module({
  providers: [DbService, RidiDbService],
  controllers: [DbController, RidiDbController],
})
export class DbModule {}
