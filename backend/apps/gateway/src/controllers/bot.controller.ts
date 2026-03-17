import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
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
    this.kafkaClient.subscribeToResponseOf('odi.game.bot-update');
    await this.kafkaClient.connect();
  }

  @Get()
  async list() {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.bot-list', {}),
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
}
