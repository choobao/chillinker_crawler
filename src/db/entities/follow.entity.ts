import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity({
  name: 'follows',
})
export class Follows {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  followingId: number;

  @Column({ type: 'int', nullable: false })
  followerId: number;

  @ManyToOne(() => Users, (user) => user.followings, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'following_id', referencedColumnName: 'id' }])
  followings: Users;

  @ManyToOne(() => Users, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'follower_id', referencedColumnName: 'id' }])
  followers: Users;
}
