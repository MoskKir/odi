import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common';
import { GameGateway } from '../websocket/game.gateway';

@Controller()
export class EventListenerService {
  private readonly logger = new Logger(EventListenerService.name);

  constructor(private readonly gameGateway: GameGateway) {}

  @EventPattern(KAFKA_TOPICS.EVENTS.SESSION)
  handleSessionEvent(@Payload() data: { sessionId: string; type?: string; [key: string]: any }) {
    this.logger.log(`session event: ${JSON.stringify(data).slice(0, 200)}`);

    if (data.type?.startsWith('board-card') || data.type?.startsWith('board-cards')) {
      this.gameGateway.server
        .to(data.sessionId)
        .emit('board:update', data);
    } else {
      this.gameGateway.server
        .to(data.sessionId)
        .emit('session:update', data);
    }
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.CHAT)
  handleChatEvent(@Payload() data: { sessionId: string; type?: string; [key: string]: any }) {
    this.logger.log(`chat event: ${JSON.stringify(data).slice(0, 200)}`);

    if (data.type === 'chat:edited') {
      this.gameGateway.server
        .to(data.sessionId)
        .emit('chat:edited', data);
    } else if (data.type === 'chat:deleted') {
      this.gameGateway.server
        .to(data.sessionId)
        .emit('chat:deleted', data);
    } else {
      this.gameGateway.server
        .to(data.sessionId)
        .emit('chat:message', data);
    }
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.CHAT_STREAM)
  handleChatStreamEvent(@Payload() data: { sessionId: string; type: string; streamId?: string; [key: string]: any }) {
    const eventMap = {
      start: 'chat:stream-start',
      chunk: 'chat:stream-chunk',
      end: 'chat:stream-end',
    };
    const event = eventMap[data.type];
    if (data.type !== 'chunk') {
      this.logger.log(`[CHAT_STREAM] type=${data.type} streamId=${data.streamId} room=${data.sessionId}`);
    }
    if (event) {
      this.gameGateway.server.to(data.sessionId).emit(event, data);
    }
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.EMOTION)
  handleEmotionEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.gameGateway.server
      .to(data.sessionId)
      .emit('emotion:update', data);
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.PHASE)
  handlePhaseEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.gameGateway.server
      .to(data.sessionId)
      .emit('phase:update', data);
  }
}
