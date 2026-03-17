import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common';
import { GameGateway } from '../websocket/game.gateway';

@Controller()
export class EventListenerService {
  private readonly logger = new Logger(EventListenerService.name);

  constructor(private readonly gameGateway: GameGateway) {}

  @EventPattern(KAFKA_TOPICS.EVENTS.SESSION)
  handleSessionEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.logger.log(`session event: ${JSON.stringify(data).slice(0, 200)}`);
    this.gameGateway.server
      .to(data.sessionId)
      .emit('session:update', data);
  }

  @EventPattern(KAFKA_TOPICS.EVENTS.CHAT)
  handleChatEvent(@Payload() data: { sessionId: string; [key: string]: any }) {
    this.logger.log(`chat event: ${JSON.stringify(data).slice(0, 200)}`);
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
