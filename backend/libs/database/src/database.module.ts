import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  UserEntity,
  ScenarioEntity,
  BotConfigEntity,
  GameSessionEntity,
  SessionParticipantEntity,
  SessionPhaseEntity,
  ChatMessageEntity,
  BoardCardEntity,
  EmotionSnapshotEntity,
  ActivityLogEntity,
  SystemSettingEntity,
} from './entities';

const ALL_ENTITIES = [
  UserEntity,
  ScenarioEntity,
  BotConfigEntity,
  GameSessionEntity,
  SessionParticipantEntity,
  SessionPhaseEntity,
  ChatMessageEntity,
  BoardCardEntity,
  EmotionSnapshotEntity,
  ActivityLogEntity,
  SystemSettingEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get<string>('DB_NAME'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        entities: ALL_ENTITIES,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
