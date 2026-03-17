import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';
import { UserEntity } from './user.entity';
import { BotConfigEntity } from './bot-config.entity';

@Entity('session_participants')
export class SessionParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', nullable: true })
  botConfigId: string | null;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: 0 })
  contributionsCount: number;

  @Column({ type: 'varchar', nullable: true })
  currentEmotion: string | null;

  @Column({ type: 'int' })
  slotIndex: number;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => GameSessionEntity, (s) => s.participants)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => BotConfigEntity)
  @JoinColumn({ name: 'botConfigId' })
  botConfig: BotConfigEntity;
}
