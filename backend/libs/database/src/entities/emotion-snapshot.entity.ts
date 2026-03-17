import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';

@Entity('emotion_snapshots')
export class EmotionSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  engagement: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tension: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  creativity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  fatigue: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => GameSessionEntity)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;
}
