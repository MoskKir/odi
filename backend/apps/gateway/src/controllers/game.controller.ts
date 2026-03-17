import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  KAFKA_TOPICS,
  CreateGameDto,
  UpdateGameStatusDto,
} from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.LIST);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.CREATE);
    this.kafkaClient.subscribeToResponseOf('odi.game.get');
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.UPDATE_STATUS);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.JOIN);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.LEAVE);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.GAME.PHASE_ADVANCE);
    await this.kafkaClient.connect();
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.LIST, {
        userId: user.id,
        status,
        search,
        limit: limit || 20,
        offset: offset || 0,
      }),
    );
  }

  @Post()
  async create(
    @Body() dto: CreateGameDto,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.CREATE, {
        ...dto,
        hostId: user.id,
      }),
    );
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.get', { id }),
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGameStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.UPDATE_STATUS, {
        sessionId: id,
        status: dto.status,
        userId: user.id,
      }),
    );
  }

  @Post(':id/join')
  async join(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.JOIN, {
        sessionId: id,
        userId: user.id,
      }),
    );
  }

  @Post(':id/leave')
  async leave(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.LEAVE, {
        sessionId: id,
        userId: user.id,
      }),
    );
  }

  @Post(':id/phase/advance')
  async advancePhase(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.PHASE_ADVANCE, {
        sessionId: id,
        userId: user.id,
        direction: 'next',
      }),
    );
  }
}
