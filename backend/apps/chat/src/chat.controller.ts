import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
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

  @EventPattern(KAFKA_TOPICS.REFLECTION.SAVE)
  async saveReflection(
    @Payload()
    data: {
      sessionId: string;
      botConfigId: string;
      prompt: string;
      text: string;
    },
  ) {
    return this.chatService.saveReflection(data);
  }

  @MessagePattern(KAFKA_TOPICS.REFLECTION.LIST)
  async getReflections(
    @Payload() data: { sessionId: string },
  ) {
    return this.chatService.getReflections(data.sessionId);
  }
}
