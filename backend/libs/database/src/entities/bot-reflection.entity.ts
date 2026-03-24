import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';
import { BotConfigEntity } from './bot-config.entity';

@Entity('bot_reflections')
export class BotReflectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid' })
  botConfigId: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => GameSessionEntity)
  @JoinColumn({ name: 'sessionId' })
  session: GameSessionEntity;

  @ManyToOne(() => BotConfigEntity)
  @JoinColumn({ name: 'botConfigId' })
  botConfig: BotConfigEntity;
}
