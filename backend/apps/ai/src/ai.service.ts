import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_TOPICS, GenerateDto } from '@app/common';
import {
  BotConfigEntity,
  ChatMessageEntity,
  SessionParticipantEntity,
  GameSessionEntity,
  SessionPhaseEntity,
  BotStageContextEntity,
  StageSharedContextEntity,
} from '@app/database';
import { OpenRouterService } from './openrouter/openrouter.service';
import { PromptBuilderService } from './prompts/prompt-builder.service';
import { ContextBuilderService } from './prompts/context-builder.service';
import { EmotionAnalyzerService } from './emotion/emotion-analyzer.service';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly strategyOverrides = new Map<string, string>();
  private readonly recentTestChats = new Map<string, number>();
  private readonly activeStreams = new Map<string, AbortController>();
  private readonly sessionStreams = new Map<string, Set<string>>();
  /** Sessions where generation was stopped — skip new generate() calls for a short period */
  private readonly stoppedSessions = new Map<string, number>();

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @InjectRepository(BotConfigEntity)
    private readonly botConfigRepo: Repository<BotConfigEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @InjectRepository(GameSessionEntity)
    private readonly sessionRepo: Repository<GameSessionEntity>,
    @InjectRepository(SessionPhaseEntity)
    private readonly phaseRepo: Repository<SessionPhaseEntity>,
    @InjectRepository(BotStageContextEntity)
    private readonly botStageCtxRepo: Repository<BotStageContextEntity>,
    @InjectRepository(StageSharedContextEntity)
    private readonly sharedCtxRepo: Repository<StageSharedContextEntity>,
    private readonly openRouterService: OpenRouterService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly emotionAnalyzer: EmotionAnalyzerService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async generate(dto: GenerateDto) {
    // Skip if session was recently stopped
    const stoppedAt = this.stoppedSessions.get(dto.sessionId);
    if (stoppedAt && Date.now() - stoppedAt < 5000) {
      this.logger.log(`Skipping generate for session ${dto.sessionId} — recently stopped`);
      return { text: '', skipped: true };
    }

    const streamId = `${dto.sessionId}:${dto.botConfigId}:${Date.now()}`;
    let streamStarted = false;
    let fullText = '';

    try {
      this.logger.log(
        `Generating AI response for session ${dto.sessionId}, bot ${dto.botConfigId}`,
      );

      // Load bot config from DB
      const botConfig = await this.botConfigRepo.findOne({
        where: { id: dto.botConfigId },
      });

      if (!botConfig) {
        this.logger.warn(`BotConfig not found: ${dto.botConfigId}`);
        return this.emitBotError(dto, streamId, `Bot config not found: ${dto.botConfigId}`);
      }

      // Load recent messages for context
      const recentDbMessages = await this.messageRepo.find({
        where: { sessionId: dto.sessionId },
        relations: ['participant', 'participant.user', 'participant.botConfig'],
        order: { createdAt: 'DESC' },
        take: 20,
      });

      const recentMessages = recentDbMessages.reverse().map((msg) => ({
        role: msg.participant?.botConfigId ? 'bot' : 'user',
        author:
          msg.participant?.user?.name ||
          msg.participant?.botConfig?.name ||
          'Unknown',
        text: msg.text,
      }));

      // Load stage-specific context if available
      let stageContext: BotStageContextEntity | null = null;
      let sharedContext: StageSharedContextEntity | null = null;
      try {
        const session = await this.sessionRepo.findOne({
          where: { id: dto.sessionId },
        });
        if (session?.scenarioId) {
          const activePhase = await this.phaseRepo.findOne({
            where: { sessionId: dto.sessionId, status: 'active' as any },
          });
          if (activePhase) {
            [stageContext, sharedContext] = await Promise.all([
              this.botStageCtxRepo.findOne({
                where: {
                  scenarioId: session.scenarioId,
                  stageName: activePhase.name,
                  botConfigId: dto.botConfigId,
                  active: true,
                },
              }),
              this.sharedCtxRepo.findOne({
                where: {
                  scenarioId: session.scenarioId,
                  stageName: activePhase.name,
                },
              }),
            ]);
          }
        }
      } catch (e) {
        this.logger.warn(`Failed to load stage context: ${e.message}`);
      }

      // Build system prompt — use DB systemPrompt if available, else fallback to template
      const systemPrompt = botConfig.systemPrompt
        ? this.promptBuilder.buildFromConfig(botConfig, {
            sessionId: dto.sessionId,
            strategyOverride: this.strategyOverrides.get(dto.botConfigId),
            stageContext,
            sharedContext,
          })
        : this.promptBuilder.build({
            botConfigId: botConfig.specialistId,
            sessionId: dto.sessionId,
            trigger: dto.trigger,
            strategyOverride: this.strategyOverrides.get(dto.botConfigId),
          });

      // Build conversation context with history
      const messages = this.contextBuilder.build({
        systemPrompt,
        trigger: dto.trigger,
        recentMessages,
      });

      // Notify clients that streaming started
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'start',
        }),
      );
      streamStarted = true;

      // Stream response from OpenRouter using bot's own model/params
      const abortController = new AbortController();
      this.activeStreams.set(streamId, abortController);
      // Track stream by session for stop-all
      if (!this.sessionStreams.has(dto.sessionId)) {
        this.sessionStreams.set(dto.sessionId, new Set());
      }
      this.sessionStreams.get(dto.sessionId)!.add(streamId);

      const stream = this.openRouterService.completeStream({
        model: botConfig.model || 'google/gemini-2.0-flash-001',
        messages,
        temperature: Number(botConfig.temperature) || 0.7,
        maxTokens: botConfig.maxTokens || 4096,
        signal: abortController.signal,
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

      this.activeStreams.delete(streamId);
      this.sessionStreams.get(dto.sessionId)?.delete(streamId);

      // Notify clients that streaming ended
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'end',
        }),
      );

      // Only save non-empty responses
      if (fullText.trim()) {
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.CHAT.SEND, {
            sessionId: dto.sessionId,
            botConfigId: dto.botConfigId,
            text: fullText,
            isBot: true,
          }),
        );
      }

      return { text: fullText };
    } catch (error) {
      this.activeStreams.delete(streamId);
      this.sessionStreams.get(dto.sessionId)?.delete(streamId);

      // If aborted by user, gracefully end the stream without saving
      const isAborted = error.name === 'AbortError'
        || error.name === 'CanceledError'
        || error.code === 'ERR_CANCELED'
        || error.code === 'ERR_STREAM_PREMATURE_CLOSE'
        || (error.code === 'ERR_STREAM_DESTROYED');
      if (isAborted) {
        this.logger.log(`Stream ${streamId} was stopped by user (${fullText.length} chars generated)`);

        if (streamStarted) {
          await lastValueFrom(
            this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
              sessionId: dto.sessionId,
              botConfigId: dto.botConfigId,
              streamId,
              type: 'end',
              stopped: true,
            }),
          ).catch(() => {});
        }

        return { text: fullText, stopped: true };
      }

      this.logger.error(
        `AI generation failed for bot ${dto.botConfigId}: ${error.message}`,
      );
      return this.emitBotError(dto, streamId, error.message, streamStarted);
    }
  }

  private async emitBotError(
    dto: GenerateDto,
    streamId: string,
    errorMessage: string,
    streamStarted = false,
  ) {
    // If stream was already started, close it so the frontend doesn't hang
    if (streamStarted) {
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'end',
          error: errorMessage,
        }),
      ).catch(() => {});
    }

    // Send error as a visible chat event so users see what happened
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT, {
        sessionId: dto.sessionId,
        message: {
          id: `error-${streamId}`,
          sessionId: dto.sessionId,
          participantId: null,
          author: 'System',
          role: 'system',
          text: `⚠ Ошибка бота: ${errorMessage}`,
          isSystem: true,
          createdAt: new Date().toISOString(),
        },
      }),
    ).catch(() => {});

    return { error: errorMessage };
  }

  async generateReflection(dto: GenerateDto) {
    const streamId = `reflection:${dto.sessionId}:${dto.botConfigId}:${Date.now()}`;
    let streamStarted = false;
    let fullText = '';

    try {
      this.logger.log(
        `Generating reflection for session ${dto.sessionId}, bot ${dto.botConfigId}`,
      );

      const botConfig = await this.botConfigRepo.findOne({
        where: { id: dto.botConfigId },
      });

      if (!botConfig) {
        this.logger.warn(`BotConfig not found: ${dto.botConfigId}`);
        return { error: `Bot config not found: ${dto.botConfigId}` };
      }

      // Load recent messages for context
      const recentDbMessages = await this.messageRepo.find({
        where: { sessionId: dto.sessionId },
        relations: ['participant', 'participant.user', 'participant.botConfig'],
        order: { createdAt: 'DESC' },
        take: 20,
      });

      const recentMessages = recentDbMessages.reverse().map((msg) => ({
        role: msg.participant?.botConfigId ? 'bot' : 'user',
        author:
          msg.participant?.user?.name ||
          msg.participant?.botConfig?.name ||
          'Unknown',
        text: msg.text,
      }));

      // Build system prompt for reflection
      const basePrompt = botConfig.systemPrompt
        ? this.promptBuilder.buildFromConfig(botConfig, {
            sessionId: dto.sessionId,
            strategyOverride: this.strategyOverrides.get(dto.botConfigId),
          })
        : this.promptBuilder.build({
            botConfigId: botConfig.specialistId,
            sessionId: dto.sessionId,
            trigger: dto.trigger,
            strategyOverride: this.strategyOverrides.get(dto.botConfigId),
          });

      const messages = this.contextBuilder.build({
        systemPrompt: basePrompt + '\n\nЭто запрос на рефлексию. Ответ не будет показан в общем чате — он виден только наблюдателям в режиме "Аквариум".',
        trigger: dto.trigger,
        recentMessages,
      });

      // Stream via REFLECTION_STREAM events (not CHAT_STREAM)
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'start',
        }),
      );
      streamStarted = true;

      const abortController = new AbortController();
      this.activeStreams.set(streamId, abortController);
      if (!this.sessionStreams.has(dto.sessionId)) {
        this.sessionStreams.set(dto.sessionId, new Set());
      }
      this.sessionStreams.get(dto.sessionId)!.add(streamId);

      const stream = this.openRouterService.completeStream({
        model: botConfig.model || 'google/gemini-2.0-flash-001',
        messages,
        temperature: Number(botConfig.temperature) || 0.7,
        maxTokens: botConfig.maxTokens || 4096,
        signal: abortController.signal,
      });

      for await (const chunk of stream) {
        fullText += chunk;
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION_STREAM, {
            sessionId: dto.sessionId,
            botConfigId: dto.botConfigId,
            streamId,
            type: 'chunk',
            content: chunk,
          }),
        );
      }

      this.activeStreams.delete(streamId);
      this.sessionStreams.get(dto.sessionId)?.delete(streamId);

      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION_STREAM, {
          sessionId: dto.sessionId,
          botConfigId: dto.botConfigId,
          streamId,
          type: 'end',
        }),
      );

      // Save reflection via chat service
      if (fullText.trim()) {
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.REFLECTION.SAVE, {
            sessionId: dto.sessionId,
            botConfigId: dto.botConfigId,
            prompt: dto.trigger,
            text: fullText,
          }),
        );
      }

      return { text: fullText };
    } catch (error) {
      this.activeStreams.delete(streamId);
      this.sessionStreams.get(dto.sessionId)?.delete(streamId);

      const isAborted = error.name === 'AbortError'
        || error.name === 'CanceledError'
        || error.code === 'ERR_CANCELED'
        || error.code === 'ERR_STREAM_PREMATURE_CLOSE'
        || error.code === 'ERR_STREAM_DESTROYED';

      if (isAborted) {
        if (streamStarted) {
          await lastValueFrom(
            this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION_STREAM, {
              sessionId: dto.sessionId,
              botConfigId: dto.botConfigId,
              streamId,
              type: 'end',
              stopped: true,
            }),
          ).catch(() => {});
        }
        return { text: fullText, stopped: true };
      }

      this.logger.error(
        `Reflection generation failed for bot ${dto.botConfigId}: ${error.message}`,
      );

      if (streamStarted) {
        await lastValueFrom(
          this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION_STREAM, {
            sessionId: dto.sessionId,
            botConfigId: dto.botConfigId,
            streamId,
            type: 'end',
            error: error.message,
          }),
        ).catch(() => {});
      }

      return { error: error.message };
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
        maxTokens: Number(data.maxTokens) || 4096,
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

  stopStream(data: { sessionId: string; streamId?: string }) {
    // Block new generations for this session for 5 seconds
    this.stoppedSessions.set(data.sessionId, Date.now());
    setTimeout(() => this.stoppedSessions.delete(data.sessionId), 6000);

    if (data.streamId) {
      const ctrl = this.activeStreams.get(data.streamId);
      if (ctrl) {
        ctrl.abort();
        this.activeStreams.delete(data.streamId);
        this.sessionStreams.get(data.sessionId)?.delete(data.streamId);
        this.logger.log(`Stream ${data.streamId} aborted by user`);
      }
    } else {
      // Stop all streams for the session
      const streamIds = this.sessionStreams.get(data.sessionId);
      if (streamIds) {
        for (const sid of streamIds) {
          const ctrl = this.activeStreams.get(sid);
          if (ctrl) {
            ctrl.abort();
            this.activeStreams.delete(sid);
          }
        }
        streamIds.clear();
        this.logger.log(`All streams for session ${data.sessionId} aborted by user`);
      }
    }
    return { ok: true };
  }

  async changeStrategy(data: { botConfigId: string; strategy: string }) {
    this.strategyOverrides.set(data.botConfigId, data.strategy);
    this.logger.log(
      `Strategy for bot ${data.botConfigId} changed to: ${data.strategy}`,
    );
    return { success: true };
  }
}
