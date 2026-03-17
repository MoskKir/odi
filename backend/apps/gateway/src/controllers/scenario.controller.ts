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
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('scenarios')
export class ScenarioController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('odi.game.scenario-list');
    this.kafkaClient.subscribeToResponseOf('odi.game.scenario-create');
    this.kafkaClient.subscribeToResponseOf('odi.game.scenario-update');
    this.kafkaClient.subscribeToResponseOf('odi.game.scenario-delete');
    await this.kafkaClient.connect();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: { id: string; role: string }) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.scenario-list', {
        role: user.role,
      }),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.scenario-create', dto),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.scenario-update', { id, ...dto }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.scenario-delete', { id }),
    );
  }
}
