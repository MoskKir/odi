import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(KAFKA_TOPICS.CHAT.SEND)
  async send(
    @Payload()
    data: {
      sessionId: string;
      userId?: string;
      botConfigId?: string;
      text: string;
      isBot?: boolean;
    },
  ) {
    return this.chatService.send(data);
  }

  @MessagePattern(KAFKA_TOPICS.CHAT.HISTORY)
  async getHistory(
    @Payload() data: { sessionId: string; limit: number; offset: number },
  ) {
    return this.chatService.getHistory(data.sessionId, data.limit, data.offset);
  }
}
