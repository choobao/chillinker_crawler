import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebContents } from './webContents.entity';

@Entity({
  name: 'pReviews',
})
export class PReviews {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 1000 })
  content: string;

  @Column({ type: 'int', default: 0, nullable: false })
  likeCount: number;

  @Column({ type: 'varchar', nullable: false })
  writer: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  //**WebContents와 p_reviews는 1:N
  @ManyToOne(() => WebContents, (webContent) => webContent.pReviews, {
    onDelete: 'CASCADE',
  })
  webContent: WebContents;

  @Column('int', { name: 'web_content_id', nullable: false })
  webContentId: number;
}
