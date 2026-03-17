import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import {
  ChatMessageEntity,
  SessionParticipantEntity,
} from '@app/database';
import { KAFKA_TOPICS } from '@app/common';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async send(data: {
    sessionId: string;
    userId?: string;
    botConfigId?: string;
    text: string;
    isBot?: boolean;
  }) {
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
        `Participant not found for session ${data.sessionId}`,
      );
      throw new Error('Participant not found in this session');
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
    });

    // If this is a human message, trigger AI generation for bots
    if (!data.isBot && data.userId) {
      this.kafkaClient.emit(KAFKA_TOPICS.AI.GENERATE, {
        sessionId: data.sessionId,
        trigger: data.text,
        userId: data.userId,
      });
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
      createdAt: msg.createdAt,
    }));

    return { items, total };
  }
}
