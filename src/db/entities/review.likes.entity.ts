import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { CReviews } from './chillinker.reviews.entity';

@Entity({
  name: 'review_likes',
})
export class ReviewLikes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  like: number;

  //**Users와 Review_likes는 1:N
  @ManyToOne(() => Users, (users) => users.reviewLikes)
  users: Users;

  @Column('int', { name: 'user_id', nullable: false })
  userId: number;

  // **C_reviews와 Review_likes는 1:N
  @ManyToOne(() => CReviews, (cReviews) => cReviews.reviewLike)
  cReviews: CReviews;

  @Column('int', { name: 'c_reveiw_id', nullable: false })
  cReviewId: number;
}
