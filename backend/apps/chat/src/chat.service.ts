import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  ChatMessageEntity,
  SessionParticipantEntity,
  BotReflectionEntity,
} from '@app/database';
import { KAFKA_TOPICS } from '@app/common';
import { IsNull, Not } from 'typeorm';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @InjectRepository(BotReflectionEntity)
    private readonly reflectionRepo: Repository<BotReflectionEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async send(data: {
    sessionId: string;
    userId?: string;
    botConfigId?: string;
    text: string;
    isBot?: boolean;
  }) {
    this.logger.log(
      `chat.send received: sessionId=${data.sessionId}, userId=${data.userId}, isBot=${data.isBot}`,
    );

    // Find the participant record
    let participant: SessionParticipantEntity | null = null;

    if (data.isBot && data.botConfigId) {
      participant = await this.participantRepo.findOne({
        where: { sessionId: data.sessionId, botConfigId: data.botConfigId },
        relations: ['botConfig'],
      });
    } else if (data.userId) {
      participant = await this.participantRepo.findOne({
        where: { sessionId: data.sessionId, userId: data.userId },
        relations: ['user'],
      });
    }

    if (!participant) {
      this.logger.warn(
        `Participant not found for session ${data.sessionId}, userId=${data.userId}`,
      );
      return { error: 'Participant not found in this session' };
    }

    // Create the message
    const message = this.messageRepo.create({
      sessionId: data.sessionId,
      participantId: participant.id,
      text: data.text,
      isSystem: false,
    });

    await this.messageRepo.save(message);

    // Increment contribution count
    await this.participantRepo.increment(
      { id: participant.id },
      'contributionsCount',
      1,
    );

    // Emit chat event for WebSocket broadcast
    const author = data.isBot
      ? participant.botConfig?.name || 'Bot'
      : participant.user?.name || 'User';

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT, {
        sessionId: data.sessionId,
        message: {
          id: message.id,
          sessionId: message.sessionId,
          participantId: message.participantId,
          author,
          role: participant.role,
          text: message.text,
          isSystem: message.isSystem,
          createdAt: message.createdAt,
        },
      }),
    );

    this.logger.log(`Emitted EVENTS.CHAT for session ${data.sessionId}`);

    // Trigger bots only on direct @mention, not on every message
    if (!data.isBot && data.userId && data.text.includes('@')) {
      this.triggerMentionedBots(data.sessionId, data.text).catch((err) =>
        this.logger.error(`AI.GENERATE emit failed: ${err.message}`),
      );
    }

    return {
      id: message.id,
      sessionId: message.sessionId,
      participantId: message.participantId,
      author,
      role: participant.role,
      text: message.text,
      isSystem: message.isSystem,
      createdAt: message.createdAt,
    };
  }

  private async triggerBotResponses(sessionId: string, trigger: string) {
    const bots = await this.participantRepo.find({
      where: { sessionId, botConfigId: Not(IsNull()) },
      relations: ['botConfig'],
    });

    const enabledBots = bots.filter((b) => b.botConfig?.enabled);

    // Check if message mentions specific bot(s) by @name, @specialistId or @role
    const triggerLower = trigger.toLowerCase();
    const mentionedBots = enabledBots.filter((b) => {
      const name = b.botConfig?.name?.toLowerCase();
      const specialistId = b.botConfig?.specialistId?.toLowerCase();
      const role = b.role?.toLowerCase();
      return (
        (name && triggerLower.includes(`@${name}`)) ||
        (specialistId && triggerLower.includes(`@${specialistId}`)) ||
        (role && triggerLower.includes(`@${role}`))
      );
    });

    const targetBots = mentionedBots.length > 0 ? mentionedBots : enabledBots;

    this.logger.log(
      `Triggering AI for ${targetBots.length}/${enabledBots.length} bot(s) in session ${sessionId}` +
        (mentionedBots.length > 0
          ? ` (mentioned: ${mentionedBots.map((b) => b.botConfig?.name).join(', ')})`
          : ' (all bots)'),
    );

    for (const bot of targetBots) {
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.AI.GENERATE, {
          sessionId,
          botConfigId: bot.botConfigId,
          trigger,
        }),
      );
    }
  }

  private async triggerMentionedBots(sessionId: string, trigger: string) {
    const bots = await this.participantRepo.find({
      where: { sessionId, botConfigId: Not(IsNull()) },
      relations: ['botConfig'],
    });

    const enabledBots = bots.filter((b) => b.botConfig?.enabled);
    const triggerLower = trigger.toLowerCase();

    const mentionedBots = enabledBots.filter((b) => {
      const name = b.botConfig?.name?.toLowerCase();
      const specialistId = b.botConfig?.specialistId?.toLowerCase();
      return (
        (name && triggerLower.includes(`@${name}`)) ||
        (specialistId && triggerLower.includes(`@${specialistId}`))
      );
    });

    if (mentionedBots.length === 0) return;

    this.logger.log(
      `Triggering AI for ${mentionedBots.length} mentioned bot(s) in session ${sessionId}: ${mentionedBots.map((b) => b.botConfig?.name).join(', ')}`,
    );

    for (const bot of mentionedBots) {
      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.AI.GENERATE, {
          sessionId,
          botConfigId: bot.botConfigId,
          trigger,
        }),
      );
    }
  }

  async editMessage(data: {
    messageId: string;
    userId: string;
    userRole: string;
    text: string;
  }) {
    const message = await this.messageRepo.findOne({
      where: { id: data.messageId },
      relations: ['participant', 'participant.user', 'participant.botConfig'],
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    // Check permissions: own message OR admin editing bot message
    const isOwner = message.participant?.userId === data.userId;
    const isBotMessage = !!message.participant?.botConfigId;
    const isAdmin = data.userRole === 'admin';

    if (!isOwner && !(isAdmin && isBotMessage)) {
      return { error: 'Forbidden' };
    }

    message.text = data.text;
    message.isEdited = true;
    await this.messageRepo.save(message);

    const author =
      message.participant?.user?.name ||
      message.participant?.botConfig?.name ||
      'Unknown';

    const result = {
      id: message.id,
      sessionId: message.sessionId,
      participantId: message.participantId,
      author,
      role: message.participant?.role || 'unknown',
      text: message.text,
      isSystem: message.isSystem,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
    };

    // Broadcast edit event
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT, {
        sessionId: message.sessionId,
        type: 'chat:edited',
        message: result,
      }),
    );

    return result;
  }

  async deleteMessage(data: {
    messageId: string;
    userId: string;
    userRole: string;
  }) {
    const message = await this.messageRepo.findOne({
      where: { id: data.messageId },
      relations: ['participant', 'participant.user', 'participant.botConfig'],
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    // Check permissions: own message OR admin deleting bot message
    const isOwner = message.participant?.userId === data.userId;
    const isBotMessage = !!message.participant?.botConfigId;
    const isAdmin = data.userRole === 'admin';

    if (!isOwner && !(isAdmin && isBotMessage)) {
      return { error: 'Forbidden' };
    }

    const sessionId = message.sessionId;
    const author =
      message.participant?.user?.name ||
      message.participant?.botConfig?.name ||
      'Unknown';

    // Replace message content with deletion notice
    message.text = `⚠ Сообщение от ${author} было удалено`;
    message.isSystem = true;
    message.isEdited = true;
    await this.messageRepo.save(message);

    // Broadcast replacement event
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.CHAT, {
        sessionId,
        type: 'chat:deleted',
        message: {
          id: message.id,
          sessionId: message.sessionId,
          participantId: message.participantId,
          author: 'System',
          role: 'system',
          text: message.text,
          isSystem: true,
          isEdited: true,
          createdAt: message.createdAt,
        },
      }),
    );

    return { success: true, messageId: message.id };
  }

  async getHistory(sessionId: string, limit: number, offset: number) {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { sessionId },
      relations: ['participant', 'participant.user', 'participant.botConfig'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const items = messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      participantId: msg.participantId,
      author:
        msg.participant?.user?.name ||
        msg.participant?.botConfig?.name ||
        'Unknown',
      role: msg.participant?.role || 'unknown',
      text: msg.text,
      isSystem: msg.isSystem,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt,
    }));

    return { items, total };
  }

  async saveReflection(data: {
    sessionId: string;
    botConfigId: string;
    prompt: string;
    text: string;
  }) {
    const reflection = this.reflectionRepo.create({
      sessionId: data.sessionId,
      botConfigId: data.botConfigId,
      prompt: data.prompt,
      text: data.text,
    });

    await this.reflectionRepo.save(reflection);

    // Re-fetch with relation to get bot name
    const saved = await this.reflectionRepo.findOne({
      where: { id: reflection.id },
      relations: ['botConfig'],
    });

    const result = {
      id: reflection.id,
      sessionId: reflection.sessionId,
      botConfigId: reflection.botConfigId,
      botName: saved?.botConfig?.name || 'Bot',
      prompt: reflection.prompt,
      text: reflection.text,
      createdAt: reflection.createdAt,
    };

    // Broadcast to clients
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.REFLECTION, {
        sessionId: data.sessionId,
        reflection: result,
      }),
    );

    this.logger.log(`Saved reflection for bot ${data.botConfigId} in session ${data.sessionId}`);
    return result;
  }

  async getReflections(sessionId: string) {
    const reflections = await this.reflectionRepo.find({
      where: { sessionId },
      relations: ['botConfig'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return reflections.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      botConfigId: r.botConfigId,
      botName: r.botConfig?.name || 'Bot',
      prompt: r.prompt,
      text: r.text,
      createdAt: r.createdAt,
    }));
  }
}
