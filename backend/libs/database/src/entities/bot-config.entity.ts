import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bot_configs')
export class BotConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  specialistId: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  personality: string;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'text', nullable: true })
  reflectionPrompt: string | null;

  @Column()
  model: string;

  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'int' })
  stars: number;

  @Column({ type: 'varchar', nullable: true })
  tag: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  temperature: number;

  @Column({ type: 'int' })
  maxTokens: number;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
