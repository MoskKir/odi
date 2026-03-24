import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_TOPICS } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('games/:sessionId/messages')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.CHAT.HISTORY);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.CHAT.SEND);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.CHAT.EDIT);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.CHAT.DELETE);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.REFLECTION.LIST);
    await this.kafkaClient.connect();
  }

  @Get()
  async getHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.CHAT.HISTORY, {
        sessionId,
        limit: limit || 50,
        offset: offset || 0,
      }),
    );
  }

  @Get('reflections')
  async getReflections(
    @Param('sessionId') sessionId: string,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.REFLECTION.LIST, { sessionId }),
    );
  }

  @Post()
  async send(
    @Param('sessionId') sessionId: string,
    @Body('text') text: string,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.CHAT.SEND, {
        sessionId,
        text,
        userId: user.id,
      }),
    );
  }
}
