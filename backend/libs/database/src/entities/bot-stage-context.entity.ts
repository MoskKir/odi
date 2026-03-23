import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('bot_stage_contexts')
@Unique(['scenarioId', 'stageName', 'botConfigId'])
export class BotStageContextEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  scenarioId: string;

  @Column()
  stageName: string;

  @Column({ type: 'uuid' })
  botConfigId: string;

  @Column({ type: 'text', nullable: true })
  roleDescription: string | null;

  @Column({ type: 'text', nullable: true })
  methodologicalTask: string | null;

  @Column({ type: 'varchar', nullable: true })
  tone: string | null;

  @Column({ type: 'simple-json', nullable: true })
  triggers: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  forbidden: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  responseTemplates: { trigger: string; template: string }[] | null;

  @Column({ type: 'text', nullable: true })
  fallbackBehavior: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
