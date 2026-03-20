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
  private readonly recentTestChats = new Map<string, number>();

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

      const streamId = `${dto.sessionId}:${dto.botConfigId}:${Date.now()}`;

      // Notify clients that streaming started
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'start',
        }),
      );

      // Stream response from OpenRouter
      let fullText = '';
      const stream = this.openRouterService.completeStream({
        model: 'google/gemini-2.0-flash-001',
        messages,
        temperature: 0.7,
        maxTokens: 512,
      });

      for await (const chunk of stream) {
        fullText += chunk;

        // Emit each chunk for real-time display
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
            sessionId: dto.sessionId,
            botConfigId: dto.botConfigId,
            streamId,
            type: 'chunk',
            content: chunk,
          }),
        );
      }

      // Notify clients that streaming ended
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'end',
        }),
      );

      // Save the complete message to DB via chat service
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.CHAT.SEND, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          text: fullText,
          isBot: true,
        }),
      );

      return { text: fullText };
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async testChat(data: {
    roomId: string;
    botId: string;
    messages: { role: string; content: string }[];
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
  }) {
    // Deduplicate: hash the message content + room to detect Kafka re-delivery
    const lastMsg = data.messages?.[data.messages.length - 1]?.content || '';
    const dedupeKey = `${data.roomId}:${data.botId}:${data.messages.length}:${lastMsg.slice(0, 50)}`;
    const now = Date.now();
    const lastSeen = this.recentTestChats.get(dedupeKey);
    if (lastSeen && now - lastSeen < 15000) {
      this.logger.warn(`[TEST_CHAT] SKIPPED duplicate for room=${data.roomId} (${now - lastSeen}ms ago)`);
      return;
    }
    this.recentTestChats.set(dedupeKey, now);

    // Cleanup old entries
    for (const [key, ts] of this.recentTestChats) {
      if (now - ts > 30000) this.recentTestChats.delete(key);
    }

    const streamId = `test:${data.roomId}:${Date.now()}`;

    try {
      this.logger.log(`[TEST_CHAT] ENTER bot=${data.botId}, room=${data.roomId}, streamId=${streamId}`);

      // Notify client that streaming started
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: data.roomId,
          botConfigId: data.botId,
          streamId,
          type: 'start',
        }),
      );

      // Build messages with system prompt
      const messages = [
        { role: 'system' as const, content: data.systemPrompt },
        ...data.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      // Stream from OpenRouter
      let fullText = '';
      const stream = this.openRouterService.completeStream({
        model: data.model,
        messages,
        temperature: Number(data.temperature) || 0.7,
        maxTokens: Number(data.maxTokens) || 512,
      });

      for await (const chunk of stream) {
        fullText += chunk;
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
            sessionId: data.roomId,
            botConfigId: data.botId,
            streamId,
            type: 'chunk',
            content: chunk,
          }),
        );
      }

      // Notify stream ended
      this.logger.log(`[TEST_CHAT] STREAM_END streamId=${streamId}`);
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: data.roomId,
          botConfigId: data.botId,
          streamId,
          type: 'end',
          fullText,
        }),
      );

      return { text: fullText };
    } catch (error) {
      this.logger.error(`Test chat failed: ${error.message}`, error.stack);

      // Notify client of error
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: data.roomId,
          botConfigId: data.botId,
          streamId,
          type: 'end',
          error: error.message,
        }),
      );

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
