import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';
import { SessionParticipantEntity } from './session-participant.entity';

@Entity('chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid' })
  participantId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => GameSessionEntity)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;

  @ManyToOne(() => SessionParticipantEntity)
  @JoinColumn({ name: 'participantId' })
  participant: SessionParticipantEntity;
}
