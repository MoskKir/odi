import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_TOPICS, GenerateDto } from '@app/common';
import { OpenRouterService } from './openrouter/openrouter.service';
import { PromptBuilderService } from './prompts/prompt-builder.service';
import { ContextBuilderService } from './prompts/context-builder.service';
import { EmotionAnalyzerService } from './emotion/emotion-analyzer.service';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly strategyOverrides = new Map<string, string>();

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly openRouterService: OpenRouterService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly emotionAnalyzer: EmotionAnalyzerService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async generate(dto: GenerateDto) {
    try {
      this.logger.log(
        `Generating AI response for session ${dto.sessionId}, bot ${dto.botConfigId}`,
      );

      // Build system prompt using bot config info
      const systemPrompt = this.promptBuilder.build({
        botConfigId: dto.botConfigId,
        sessionId: dto.sessionId,
        trigger: dto.trigger,
        strategyOverride: this.strategyOverrides.get(dto.botConfigId),
      });

      // Build conversation context
      const messages = this.contextBuilder.build({
        systemPrompt,
        trigger: dto.trigger,
      });

      // Call OpenRouter
      const response = await this.openRouterService.complete({
        model: 'google/gemini-2.0-flash-001',
        messages,
        temperature: 0.7,
        maxTokens: 512,
      });

      // Emit the generated message to chat
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.CHAT.SEND, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          text: response,
          isBot: true,
        }),
      );

      // Emit chat event for WebSocket broadcast
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          text: response,
          isBot: true,
          trigger: dto.trigger,
        }),
      );

      return { text: response };
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async analyzeEmotion(data: { sessionId: string; messages: any[] }) {
    const result = await this.emotionAnalyzer.analyze(data.messages);

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.EMOTION, {
        ...result,
      }),
    );

    return result;
  }

  async changeStrategy(data: { botConfigId: string; strategy: string }) {
    this.strategyOverrides.set(data.botConfigId, data.strategy);
    this.logger.log(
      `Strategy for bot ${data.botConfigId} changed to: ${data.strategy}`,
    );
    return { success: true };
  }
}
