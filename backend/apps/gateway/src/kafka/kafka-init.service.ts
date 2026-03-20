import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { KAFKA_TOPICS } from '@app/common';

/**
 * Pre-creates all reply topics needed by subscribeToResponseOf()
 * before NestJS Kafka consumer tries to subscribe to them.
 */
@Injectable()
export class KafkaInitService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const brokers = this.config
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',');

    const kafka = new Kafka({
      clientId: 'odi-gateway-init',
      brokers,
      retry: { initialRetryTime: 300, retries: 5 },
    });

    const admin = kafka.admin();
    await admin.connect();

    // Collect all topics that need reply topics
    const replyTopics = [
      // Auth
      KAFKA_TOPICS.AUTH.REGISTER,
      KAFKA_TOPICS.AUTH.LOGIN,
      KAFKA_TOPICS.AUTH.VALIDATE_TOKEN,
      KAFKA_TOPICS.AUTH.GET_PREFERENCES,
      KAFKA_TOPICS.AUTH.UPDATE_PREFERENCES,
      'odi.auth.user-list',
      'odi.auth.user-update',
      // Game
      KAFKA_TOPICS.GAME.LIST,
      KAFKA_TOPICS.GAME.CREATE,
      'odi.game.get',
      'odi.game.update-title',
      KAFKA_TOPICS.GAME.UPDATE_STATUS,
      KAFKA_TOPICS.GAME.JOIN,
      KAFKA_TOPICS.GAME.LEAVE,
      KAFKA_TOPICS.GAME.PHASE_ADVANCE,
      'odi.game.scenario-list',
      'odi.game.scenario-create',
      'odi.game.scenario-update',
      'odi.game.scenario-delete',
      'odi.game.session-list-all',
      'odi.game.session-force-update',
      'odi.game.settings-get',
      'odi.game.settings-update',
      'odi.game.bot-list',
      'odi.game.bot-update',
      'odi.game.emotion-set',
      'odi.game.board-add',
      'odi.game.board-vote',
      // Chat
      KAFKA_TOPICS.CHAT.HISTORY,
      KAFKA_TOPICS.CHAT.SEND,
    ];

    // Event topics (fire-and-forget, no reply needed)
    const eventTopics = [
      KAFKA_TOPICS.EVENTS.SESSION,
      KAFKA_TOPICS.EVENTS.CHAT,
      KAFKA_TOPICS.EVENTS.CHAT_STREAM,
      KAFKA_TOPICS.EVENTS.EMOTION,
      KAFKA_TOPICS.EVENTS.PHASE,
      KAFKA_TOPICS.AI.GENERATE,
      KAFKA_TOPICS.AI.TEST_CHAT,
      KAFKA_TOPICS.AI.ANALYZE_EMOTION,
    ];

    // Build list of topics + reply topics
    const allTopics = new Set<string>();
    for (const topic of replyTopics) {
      allTopics.add(topic);
      allTopics.add(`${topic}.reply`);
    }
    for (const topic of eventTopics) {
      allTopics.add(topic);
    }

    const existing = await admin.listTopics();
    const toCreate = [...allTopics]
      .filter((t) => !existing.includes(t))
      .map((topic) => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      }));

    if (toCreate.length > 0) {
      await admin.createTopics({ topics: toCreate });
      console.log(
        `[KafkaInit] Created ${toCreate.length} topics: ${toCreate.map((t) => t.topic).join(', ')}`,
      );
    }

    await admin.disconnect();
  }
}
