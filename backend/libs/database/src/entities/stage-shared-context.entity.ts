import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('stage_shared_contexts')
@Unique(['scenarioId', 'stageName'])
export class StageSharedContextEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  scenarioId: string;

  @Column()
  stageName: string;

  @Column({ type: 'text', nullable: true })
  purpose: string | null;

  @Column({ type: 'text', nullable: true })
  methodologicalTask: string | null;

  @Column({ type: 'simple-json', nullable: true })
  keyConcepts: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  criticalMoments: { when: string; action: string }[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
