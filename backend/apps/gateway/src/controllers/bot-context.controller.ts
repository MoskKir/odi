import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_TOPICS, UserRole } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('scenarios/:scenarioId/bot-contexts')
export class BotContextController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.BOT_CONTEXT_LIST);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.BOT_CONTEXT_UPSERT);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.BOT_CONTEXT_DELETE);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.SHARED_CONTEXT_UPSERT);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.SHARED_CONTEXT_DELETE);
    await this.kafkaClient.connect();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Param('scenarioId') scenarioId: string) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.BOT_CONTEXT_LIST, { scenarioId }),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async upsertBot(
    @Param('scenarioId') scenarioId: string,
    @Body() dto: any,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.BOT_CONTEXT_UPSERT, {
        ...dto,
        scenarioId,
      }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteBot(@Param('id') id: string) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.BOT_CONTEXT_DELETE, { id }),
    );
  }

  @Post('shared')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async upsertShared(
    @Param('scenarioId') scenarioId: string,
    @Body() dto: any,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.SHARED_CONTEXT_UPSERT, {
        ...dto,
        scenarioId,
      }),
    );
  }

  @Delete('shared/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteShared(@Param('id') id: string) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.SHARED_CONTEXT_DELETE, { id }),
    );
  }
}
