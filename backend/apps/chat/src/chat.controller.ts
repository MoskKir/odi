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

  @MessagePattern(KAFKA_TOPICS.CHAT.EDIT)
  async edit(
    @Payload()
    data: {
      messageId: string;
      userId: string;
      userRole: string;
      text: string;
    },
  ) {
    return this.chatService.editMessage(data);
  }

  @MessagePattern(KAFKA_TOPICS.CHAT.DELETE)
  async delete(
    @Payload()
    data: {
      messageId: string;
      userId: string;
      userRole: string;
    },
  ) {
    return this.chatService.deleteMessage(data);
  }

  @MessagePattern(KAFKA_TOPICS.CHAT.HISTORY)
  async getHistory(
    @Payload() data: { sessionId: string; limit: number; offset: number },
  ) {
    return this.chatService.getHistory(data.sessionId, data.limit, data.offset);
  }
}
