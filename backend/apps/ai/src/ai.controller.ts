import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS, GenerateDto } from '@app/common';
import { AiService } from './ai.service';

@Controller()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @MessagePattern(KAFKA_TOPICS.AI.GENERATE)
  async generate(@Payload() dto: GenerateDto) {
    this.logger.log(`[GENERATE] received for session=${dto.sessionId}`);
    return this.aiService.generate(dto);
  }

  @EventPattern(KAFKA_TOPICS.AI.GENERATE_REFLECTION)
  async generateReflection(@Payload() dto: GenerateDto) {
    this.logger.log(`[GENERATE_REFLECTION] received for session=${dto.sessionId}`);
    return this.aiService.generateReflection(dto);
  }

  @EventPattern(KAFKA_TOPICS.AI.TEST_CHAT)
  async testChat(
    @Payload()
    data: {
      roomId: string;
      botId: string;
      messages: { role: string; content: string }[];
      systemPrompt: string;
      model: string;
      temperature: number;
      maxTokens: number;
    },
  ) {
    this.logger.log(`[TEST_CHAT] received roomId=${data.roomId} botId=${data.botId} msgCount=${data.messages?.length}`);
    return this.aiService.testChat(data);
  }

  @EventPattern(KAFKA_TOPICS.AI.STOP_STREAM)
  handleStopStream(
    @Payload() data: { sessionId: string; streamId?: string },
  ) {
    this.logger.log(`[STOP_STREAM] session=${data.sessionId} streamId=${data.streamId ?? 'all'}`);
    return this.aiService.stopStream(data);
  }

  @MessagePattern(KAFKA_TOPICS.AI.ANALYZE_EMOTION)
  async analyzeEmotion(
    @Payload() data: { sessionId: string; messages: any[] },
  ) {
    return this.aiService.analyzeEmotion(data);
  }

  @MessagePattern(KAFKA_TOPICS.AI.CHANGE_STRATEGY)
  async changeStrategy(
    @Payload() data: { botConfigId: string; strategy: string },
  ) {
    return this.aiService.changeStrategy(data);
  }
}
