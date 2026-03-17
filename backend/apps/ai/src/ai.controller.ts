import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS, GenerateDto } from '@app/common';
import { AiService } from './ai.service';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @MessagePattern(KAFKA_TOPICS.AI.GENERATE)
  async generate(@Payload() dto: GenerateDto) {
    return this.aiService.generate(dto);
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
