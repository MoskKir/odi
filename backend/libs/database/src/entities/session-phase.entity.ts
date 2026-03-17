import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';

export enum PhaseStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DONE = 'done',
}

@Entity('session_phases')
export class SessionPhaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'enum', enum: PhaseStatus, default: PhaseStatus.PENDING })
  status: PhaseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => GameSessionEntity, (s) => s.phases)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;
}
