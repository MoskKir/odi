import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common';
import { GameGateway } from '../websocket/game.gateway';

@Controller()
export class EventListenerService {
  constructor(private readonly gameGateway: GameGateway) {}

  @EventPattern(KAFKA_TOPICS.EVENTS.SESSION)
  handleSessionEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.gameGateway.server
      .to(data.sessionId)
      .emit('session:update', data);
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.CHAT)
  handleChatEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.gameGateway.server
      .to(data.sessionId)
      .emit('chat:message', data);
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
