import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_settings')
export class SystemSettingEntity {
  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @UpdateDateColumn()
  updatedAt: Date;
}
