import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';

export enum LogType {
  PHASE = 'phase',
  BOT = 'bot',
  PLAYER = 'player',
  SYSTEM = 'system',
  EMOTION = 'emotion',
}

@Entity('activity_logs')
export class ActivityLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'enum', enum: LogType })
  type: LogType;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => GameSessionEntity)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;
}
