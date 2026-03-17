import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DatabaseModule,
  GameSessionEntity,
  ScenarioEntity,
  SessionParticipantEntity,
  SessionPhaseEntity,
  ChatMessageEntity,
  BoardCardEntity,
  BotConfigEntity,
  EmotionSnapshotEntity,
  SystemSettingEntity,
} from '@app/database';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PhaseService } from './phase.service';
import { ScenarioService } from './scenario.service';
import { ParticipantService } from './participant.service';
import { BoardService } from './board.service';
import { SerializeInterceptor } from './serialize.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      GameSessionEntity,
      ScenarioEntity,
      SessionParticipantEntity,
      SessionPhaseEntity,
      ChatMessageEntity,
      BoardCardEntity,
      BotConfigEntity,
      EmotionSnapshotEntity,
      SystemSettingEntity,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'odi-game-producer',
              brokers: config
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [GameController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
    GameService,
    PhaseService,
    ScenarioService,
    ParticipantService,
    BoardService,
  ],
})
export class GameModule {}
