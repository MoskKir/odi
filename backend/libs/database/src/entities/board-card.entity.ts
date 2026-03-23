import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';
import { SessionParticipantEntity } from './session-participant.entity';

@Entity('board_cards')
export class BoardCardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'varchar' })
  column: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'uuid' })
  authorParticipantId: string;

  @Column({ type: 'int', default: 0 })
  votes: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => GameSessionEntity)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;

  @ManyToOne(() => SessionParticipantEntity)
  @JoinColumn({ name: 'authorParticipantId' })
  authorParticipant: SessionParticipantEntity;
}
