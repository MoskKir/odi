import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ScenarioEntity, Difficulty } from './scenario.entity';
import { UserEntity } from './user.entity';
import { SessionParticipantEntity } from './session-participant.entity';
import { SessionPhaseEntity } from './session-phase.entity';

export enum GameStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum InterfaceMode {
  CHAMELEON = 'chameleon',
  BOARD = 'board',
  THEATRE = 'theatre',
  TERMINAL = 'terminal',
}

export enum AiVisibility {
  HIDDEN = 'hidden',
  CAPTAIN = 'captain',
  TEAM = 'team',
}

@Entity('game_sessions')
export class GameSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.DRAFT })
  status: GameStatus;

  @Column({ type: 'uuid' })
  scenarioId: string;

  @Column({ type: 'uuid' })
  hostId: string;

  @Column({ type: 'enum', enum: Difficulty })
  difficulty: Difficulty;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'enum', enum: InterfaceMode })
  interfaceMode: InterfaceMode;

  @Column({ type: 'enum', enum: AiVisibility })
  aiVisibility: AiVisibility;

  @Column({ type: 'int' })
  crewSize: number;

  @Column({ type: 'varchar', length: 8, unique: true })
  inviteCode: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'int', default: 7 })
  energy: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ScenarioEntity)
  @JoinColumn({ name: 'scenarioId' })
  scenario: ScenarioEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'hostId' })
  host: UserEntity;

  @OneToMany(() => SessionParticipantEntity, (p) => p.session)
  participants: SessionParticipantEntity[];

  @OneToMany(() => SessionPhaseEntity, (p) => p.session)
  phases: SessionPhaseEntity[];
}
