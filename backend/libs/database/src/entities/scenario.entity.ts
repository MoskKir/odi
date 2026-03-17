import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('scenarios')
export class ScenarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  icon: string;

  @Column()
  title: string;

  @Column()
  subtitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: Difficulty })
  difficulty: Difficulty;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'simple-json', nullable: true })
  requiredBots: string[];

  @Column({ type: 'simple-json', nullable: true })
  recommendedBots: string[];

  @Column({ type: 'int', nullable: true })
  avgDurationMinutes: number | null;

  @Column({ default: 0 })
  sessionsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
