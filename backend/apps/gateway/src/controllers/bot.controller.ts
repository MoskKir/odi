import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UserRole } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('odi.game.bot-list');
    this.kafkaClient.subscribeToResponseOf('odi.game.bot-create');
    this.kafkaClient.subscribeToResponseOf('odi.game.bot-update');
    this.kafkaClient.subscribeToResponseOf('odi.game.bot-delete');
    await this.kafkaClient.connect();
  }

  @Get()
  async list() {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.bot-list', {}),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.bot-create', { ...dto }),
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.bot-update', { id, ...dto }),
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.bot-delete', { id }),
    );
  }
}
