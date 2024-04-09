import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BogosipType } from '../type/webContent.type';

@Entity('bogosips')
export class Bogosips {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => Users, (user) => user.bogosips)
  // user: Users;

  @Column()
  userId: number;

  // @ManyToOne(() => WebContents, (webContent) => webContent.bogosips)
  // webContent: WebContents;

  @Column()
  webContentId: number;

  @Column({ type: 'enum', enum: BogosipType })
  type: BogosipType;
}
