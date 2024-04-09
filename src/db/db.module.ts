import { Module } from '@nestjs/common';
import { DbService } from './db.service';
import { DbController } from './db.controller';
import { RidiDbService } from './ridibooks/ridi.db.service';
import { RidiDbController } from './ridibooks/ridi.db.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebContents } from './entities/webContents.entity';
import { PReviews } from './entities/platform.reviews.entity';
import { CReviews } from './entities/chillinker.reviews.entity';
import { Users } from './entities/user.entity';
import { Follows } from './entities/follow.entity';
import { Bogosips } from './entities/bogosips.entity';
import { ReviewLikes } from './entities/review.likes.entity';
import { CollectionBookmark } from './entities/collection.bookmark.entity';
import { CollectionBookmarkUser } from './entities/collection.bookmark.user.entity';
import { Collections } from './entities/collections.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebContents,
      PReviews,
      CReviews,
      Users,
      Follows,
      Bogosips,
      ReviewLikes,
      Collections,
      CollectionBookmark,
      CollectionBookmarkUser,
    ]),
  ],
  providers: [DbService, RidiDbService],
  controllers: [DbController, RidiDbController],
})
export class DbModule {}
