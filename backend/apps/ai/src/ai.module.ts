import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DatabaseModule,
  BotConfigEntity,
  ChatMessageEntity,
  SessionParticipantEntity,
  GameSessionEntity,
  SessionPhaseEntity,
  BotStageContextEntity,
  StageSharedContextEntity,
  SystemSettingEntity,
} from '@app/database';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenRouterService } from './openrouter/openrouter.service';
import { PromptBuilderService } from './prompts/prompt-builder.service';
import { ContextBuilderService } from './prompts/context-builder.service';
import { EmotionAnalyzerService } from './emotion/emotion-analyzer.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      BotConfigEntity,
      ChatMessageEntity,
      SessionParticipantEntity,
      GameSessionEntity,
      SessionPhaseEntity,
      BotStageContextEntity,
      StageSharedContextEntity,
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
              clientId: 'odi-ai-producer',
              brokers: config
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    OpenRouterService,
    PromptBuilderService,
    ContextBuilderService,
    EmotionAnalyzerService,
  ],
})
export class AiModule {}
